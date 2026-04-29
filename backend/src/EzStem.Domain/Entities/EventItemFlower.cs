namespace EzStem.Domain.Entities;

/// <summary>
/// Recipe entry: how many stems of a specific flower goes into one unit of an EventItem.
/// </summary>
public class EventItemFlower
{
    public Guid Id { get; set; }
    public Guid EventItemId { get; set; }
    public EventItem EventItem { get; set; } = null!;
    public Guid EventFlowerId { get; set; }
    public EventFlower EventFlower { get; set; } = null!;
    public int StemsNeeded { get; set; }  // stems per 1 unit of the item
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
