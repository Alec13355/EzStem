namespace EzStem.Domain.Entities;

public class PricingConfig
{
    public Guid Id { get; set; }
    public decimal MarkupFactor { get; set; } = 3.0m;
    public decimal OverheadPercent { get; set; } = 0.25m;
    public decimal LaborDefaultCost { get; set; } = 5.0m;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
