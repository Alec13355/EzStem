namespace EzStem.Domain.Entities;

public class UserSettings
{
    public Guid Id { get; set; }
    public string OwnerId { get; set; } = string.Empty;
    public string ThemeJson { get; set; } = "{}";
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
