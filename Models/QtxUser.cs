using Microsoft.AspNetCore.Identity;

namespace MyAuthWebApi.Models;
public class QtxUser : IdentityUser
{
    public virtual ICollection<Claim> Claims { get; set; } = new List<Claim>();
}

// public class UserClaim
// {
//     public int Id { get; set; }
//     public string UserId { get; set; } = string.Empty;
//     public string ClaimId { get; set; } = string.Empty;
//     
//     public virtual IdentityUser User { get; set; }
//     public virtual Claim Claim { get; set; }
// }