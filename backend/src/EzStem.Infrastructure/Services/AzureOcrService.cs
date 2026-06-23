using Azure;
using Azure.AI.FormRecognizer.DocumentAnalysis;
using EzStem.Application.Interfaces;
using Microsoft.Extensions.Configuration;

namespace EzStem.Infrastructure.Services;

public class AzureOcrService : IOcrService
{
    private readonly IConfiguration _config;
    private DocumentAnalysisClient? _client;

    public AzureOcrService(IConfiguration config)
    {
        _config = config;
    }

    private DocumentAnalysisClient GetClient()
    {
        if (_client != null) return _client;

        var endpoint = _config["AzureVision:Endpoint"];
        var key = _config["AzureVision:Key"];

        if (string.IsNullOrEmpty(endpoint) || string.IsNullOrEmpty(key))
            throw new InvalidOperationException("Azure Document Intelligence is not configured. Set AzureVision:Endpoint and AzureVision:Key.");

        _client = new DocumentAnalysisClient(new Uri(endpoint), new AzureKeyCredential(key));
        return _client;
    }

    public async Task<IEnumerable<ParsedFlowerRow>> ParseFlowerPdfAsync(Stream pdfStream, CancellationToken ct = default)
    {
        var client = GetClient();
        var operation = await client.AnalyzeDocumentAsync(
            WaitUntil.Completed,
            "prebuilt-layout",
            pdfStream,
            cancellationToken: ct);

        var result = operation.Value;
        var rows = new List<ParsedFlowerRow>();
        string currentCategory = "Uncategorized";

        // First, scan paragraphs for category headers (bold/large text without prices)
        foreach (var paragraph in result.Paragraphs)
        {
            var text = paragraph.Content?.Trim() ?? "";
            // Category headers typically contain parentheses and no dollar signs
            if (!string.IsNullOrEmpty(text) && 
                text.Contains("(") && 
                text.Contains(")") && 
                !text.Contains("$") && 
                !text.Contains("."))
            {
                currentCategory = text;
            }
        }

        // Then, parse tables for flower data
        foreach (var table in result.Tables)
        {
            // Group cells by row
            var rowGroups = table.Cells
                .GroupBy(c => c.RowIndex)
                .OrderBy(g => g.Key)
                .ToList();

            // Detect header row to find column positions
            var headerRow = rowGroups.FirstOrDefault();
            int nameCol = -1, unitCol = -1, priceCol = -1;
            
            if (headerRow != null)
            {
                var headers = headerRow.OrderBy(c => c.ColumnIndex).ToList();
                for (int i = 0; i < headers.Count; i++)
                {
                    var headerText = headers[i].Content?.ToLower().Trim() ?? "";
                    if (headerText == "item" || headerText.Contains("name"))
                        nameCol = i;
                    else if (headerText == "u.m." || headerText == "um" || headerText == "uom" ||
                             (headerText.Contains("unit") && !headerText.Contains("/")))
                        unitCol = i;
                    else if (headerText.Contains("rate") || headerText.Contains("price") || headerText.Contains("cost"))
                        priceCol = i;
                }
            }

            // If columns not detected, assume standard layout: name, unit, price
            if (nameCol == -1) nameCol = 0;
            if (unitCol == -1) unitCol = 1;
            if (priceCol == -1) priceCol = 2;

            // Parse data rows (skip header)
            foreach (var rowGroup in rowGroups.Skip(1))
            {
                var cells = rowGroup.OrderBy(c => c.ColumnIndex).ToList();
                if (cells.Count < 2) continue;

                var rawName = cells.ElementAtOrDefault(nameCol)?.Content?.Trim() ?? "";
                // Strip leading item codes (e.g. "608617 Rose Name" → "Rose Name") and take first line only
                var nameText = System.Text.RegularExpressions.Regex.Replace(rawName, @"^\d+\s+", "");
                var newlineIdx = nameText.IndexOfAny(new[] { '\n', '\r' });
                if (newlineIdx > 0) nameText = nameText[..newlineIdx];
                nameText = nameText.Trim();

                // Some invoices repeat the name on the same line (e.g. "Rose White Rose White")
                // instead of a separate line below the bold heading. Collapse exact repeats.
                var dedupMatch = System.Text.RegularExpressions.Regex.Match(
                    nameText, @"^(.+?)\s+\1$", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                if (dedupMatch.Success) nameText = dedupMatch.Groups[1].Value.Trim();

                var unitText = cells.ElementAtOrDefault(unitCol)?.Content?.Trim() ?? "";
                var priceText = cells.ElementAtOrDefault(priceCol)?.Content?.Trim() ?? "";

                // Check if this is a category header row
                if (nameText.Contains("(") && nameText.Contains(")") && !priceText.Contains("$"))
                {
                    currentCategory = nameText;
                    continue;
                }

                // Skip rows without valid data
                if (string.IsNullOrEmpty(nameText) || string.IsNullOrEmpty(priceText))
                    continue;

                // Parse price
                if (!TryParsePrice(priceText, out decimal price))
                    continue;

                // Parse unit and determine UnitsPerBunch
                var (unit, unitsPerBunch) = ParseUnit(unitText);

                // CostPerUnit is the rate for the listed unit (e.g. per bunch of 10, or 25 for roses) —
                // consumers that need a per-stem price are responsible for dividing by UnitsPerBunch.
                rows.Add(new ParsedFlowerRow(nameText, unit, price, unitsPerBunch, currentCategory));
            }
        }

        return rows;
    }

    private static bool TryParsePrice(string priceText, out decimal price)
    {
        price = 0;
        var cleaned = priceText.Replace("$", "").Replace("£", "").Replace("€", "").Trim();
        return decimal.TryParse(cleaned, System.Globalization.NumberStyles.Any,
            System.Globalization.CultureInfo.InvariantCulture, out price);
    }

    private static (string unit, int unitsPerBunch) ParseUnit(string unitText)
    {
        var lower = unitText.ToLower().Trim();
        
        // Handle explicit bunch quantities like "10s", "25s", "bch 10"
        if (lower.Contains("10") && (lower.Contains("s") || lower.Contains("stem") || lower.Contains("bch")))
            return ("Bunch", 10);
        if (lower.Contains("25") && (lower.Contains("s") || lower.Contains("stem") || lower.Contains("bch")))
            return ("Bunch", 25);
        if (lower.Contains("12") && (lower.Contains("s") || lower.Contains("stem") || lower.Contains("bch")))
            return ("Bunch", 12);
        if (lower.Contains("5") && (lower.Contains("s") || lower.Contains("stem") || lower.Contains("bch")))
            return ("Bunch", 5);
        
        // Handle standard units
        if (lower.Contains("bch") || lower.Contains("bunch") || lower.Contains("bu"))
            return ("Bunch", 1);
        if (lower.Contains("stem") || lower.Contains("st") || lower == "ea" || lower == "each")
            return ("Stem", 1);
        
        // Default to bunch if unclear
        return ("Bunch", 1);
    }
}