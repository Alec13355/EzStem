namespace EzStem.Domain.Entities;
public class Vendor
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ContactEmail { get; set; }
    public string? Notes { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    public ICollection<Item> Items { get; set; } = new List<Item>();
}
