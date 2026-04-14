namespace EzStem.Domain.Entities;
public class RecipeItem
{
    public Guid Id { get; set; }
    public Guid RecipeId { get; set; }
    public Recipe Recipe { get; set; } = null!;
    public Guid ItemId { get; set; }
    public Item Item { get; set; } = null!;
    public decimal Quantity { get; set; }
    public decimal CostPerStem { get; set; } // snapshot at recipe creation
}
