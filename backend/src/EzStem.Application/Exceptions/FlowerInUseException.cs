namespace EzStem.Application.Exceptions;

public class FlowerInUseException : Exception
{
    public FlowerInUseException(string message) : base(message)
    {
    }
}
