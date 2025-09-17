using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MyAuthWebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RolesController : ControllerBase
    {
        private readonly RoleManager<IdentityRole> _roleManager;

        public RolesController(RoleManager<IdentityRole> roleManager)
        {
            _roleManager = roleManager;
        }
        
        [HttpGet]
        public async Task<ActionResult<IEnumerable<IdentityRole>>> GetRoles()
        {
            return await _roleManager.Roles.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<IdentityRole>> GetRole(string id)
        {
            var role = await _roleManager.FindByIdAsync(id);
            return role;
        }
        
        [HttpPut("{id}")]
        public async Task<IActionResult> PutRole(string id, IdentityRole role)
        {
            await _roleManager.UpdateAsync(role);
            return NoContent();
        }

        [HttpPost]
        public async Task<ActionResult<IdentityRole>> PostRole(IdentityRole role)
        {
            await _roleManager.CreateAsync(role);
            return CreatedAtAction("GetRole", new { id = role.Id }, role);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRole(string id)
        {
            var role = await _roleManager.FindByIdAsync(id);
            await _roleManager.DeleteAsync(role);
                return NoContent();
        }

        private bool RoleExists(string id)
        {
            return _roleManager.Roles.Any(e => e.Id == id);
        }
    }
}
