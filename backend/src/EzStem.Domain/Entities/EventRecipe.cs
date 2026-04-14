namespace EzStem.Domain.Entities;
public class EventRecipe
{
    public Guid Id { get; set; }
    public Guid EventId { get; set; }
    public FloristEvent Event { get; set; } = null!;
    public Guid RecipeId { get; set; }
    public Recipe Recipe { get; set; } = null!;
    public int Quantity { get; set; } = 1; // how many of this recipe for the event
}
