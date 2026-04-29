namespace EzStem.Domain.Entities;
public class FloristEvent
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime EventDate { get; set; }
    public string? ClientName { get; set; }
    public string? Notes { get; set; }
    public decimal TotalBudget { get; set; } = 0m;
    public decimal ProfitMultiple { get; set; } = 1.0m;
    public EventStatus Status { get; set; } = EventStatus.Draft;
    public string? OwnerId { get; set; }
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    public ICollection<EventRecipe> EventRecipes { get; set; } = new List<EventRecipe>();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public enum EventStatus { Draft, Confirmed, Ordered, Completed }
