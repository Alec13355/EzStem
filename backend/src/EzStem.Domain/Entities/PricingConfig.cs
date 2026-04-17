namespace EzStem.Domain.Entities;

public class PricingConfig
{
    public Guid Id { get; set; }
    public string? OwnerId { get; set; }
    public decimal DefaultMarkupPercentage { get; set; } = 35.0m;
    public decimal DefaultLaborRate { get; set; } = 25.0m;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
