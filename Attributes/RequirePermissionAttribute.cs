namespace MyAuthWebApi.Attributes;

[AttributeUsage(AttributeTargets.Method)]
public class RequirePermissionAttribute : Attribute
{
    public RequirePermissionAttribute(string action, string resourceType, string resourceId = "*")
    {
        Action = action;
        ResourceType = resourceType;
        ResourceId = resourceId;
    }

    public string Action { get; set; }
    public string ResourceType { get; set; }
    public string ResourceId { get; set; }
}