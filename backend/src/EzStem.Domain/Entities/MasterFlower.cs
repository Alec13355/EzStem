using EzStem.Domain.Enums;

namespace EzStem.Domain.Entities;

public class MasterFlower
{
    public Guid Id { get; set; }
    public string OwnerId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public FlowerUnit Unit { get; set; } = FlowerUnit.Bunch;
    public decimal CostPerUnit { get; set; }  // cost per stem if Stem, cost per bunch if Bunch
    public int UnitsPerBunch { get; set; } = 1;  // stems per bunch (only meaningful if Unit=Bunch)
    public string Category { get; set; } = string.Empty;  // e.g. "Spray Roses (Imported)"
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
