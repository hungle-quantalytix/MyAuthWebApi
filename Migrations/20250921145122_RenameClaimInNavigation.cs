using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyAuthWebApi.Migrations
{
    /// <inheritdoc />
    public partial class RenameClaimInNavigation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Navigations_Claims_ClaimsId",
                table: "Navigations");

            migrationBuilder.RenameColumn(
                name: "ClaimsId",
                table: "Navigations",
                newName: "ClaimId");

            migrationBuilder.RenameIndex(
                name: "IX_Navigations_ClaimsId",
                table: "Navigations",
                newName: "IX_Navigations_ClaimId");

            migrationBuilder.AddForeignKey(
                name: "FK_Navigations_Claims_ClaimId",
                table: "Navigations",
                column: "ClaimId",
                principalTable: "Claims",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Navigations_Claims_ClaimId",
                table: "Navigations");

            migrationBuilder.RenameColumn(
                name: "ClaimId",
                table: "Navigations",
                newName: "ClaimsId");

            migrationBuilder.RenameIndex(
                name: "IX_Navigations_ClaimId",
                table: "Navigations",
                newName: "IX_Navigations_ClaimsId");

            migrationBuilder.AddForeignKey(
                name: "FK_Navigations_Claims_ClaimsId",
                table: "Navigations",
                column: "ClaimsId",
                principalTable: "Claims",
                principalColumn: "Id");
        }
    }
}
