namespace EzStem.Domain.Entities;
public class Item
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal CostPerStem { get; set; }
    public int BundleSize { get; set; } = 1;
    public string? ImageUrl { get; set; }
    public string? Notes { get; set; }
    public Guid? VendorId { get; set; }
    public Vendor? Vendor { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
