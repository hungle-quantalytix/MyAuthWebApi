namespace MyAuthWebApi.Models;

public class Navigation
{
    public int Id { get; set; }
    public string Display { get; set; } = string.Empty;
    public string Link { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public int Order { get; set; }
    public string OrderPath { get; set; } = string.Empty;
    public int ParentId { get; set; }
    public virtual Navigation? Parent { get; set; }
    public virtual ICollection<Navigation> Children { get; set; } = [];

    public virtual Claim? Claims { get; set; }
    public string? AdditionalRules { get; set; } = string.Empty;
}