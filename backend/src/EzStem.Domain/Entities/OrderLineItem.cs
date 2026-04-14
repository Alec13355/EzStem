namespace EzStem.Domain.Entities;
public class OrderLineItem
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;
    public Guid ItemId { get; set; }
    public Item Item { get; set; } = null!;
    public Guid? VendorId { get; set; }
    public Vendor? Vendor { get; set; }
    public decimal QuantityNeeded { get; set; }
    public decimal QuantityOrdered { get; set; } // rounded to bundle size
    public decimal CostPerUnit { get; set; }
}
