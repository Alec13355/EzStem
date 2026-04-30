namespace EzStem.Application.Interfaces;

public interface IOcrService
{
    Task<IEnumerable<ParsedFlowerRow>> ParseFlowerPdfAsync(Stream pdfStream, CancellationToken ct = default);
}

public record ParsedFlowerRow(string Name, string Unit, decimal CostPerUnit, int UnitsPerBunch, string Category);
