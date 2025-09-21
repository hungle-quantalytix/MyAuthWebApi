namespace MyAuthWebApi.Attributes;

[AttributeUsage(AttributeTargets.Method)]
public class RequireClaimAttribute(string action, string resourceType) : Attribute
{
    public string Action { get; set; } = action;
    public string ResourceType { get; set; } = resourceType;
}