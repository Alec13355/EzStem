namespace EzStem.Domain.Entities;
public class Recipe
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal LaborCost { get; set; }
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    public ICollection<RecipeItem> RecipeItems { get; set; } = new List<RecipeItem>();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
