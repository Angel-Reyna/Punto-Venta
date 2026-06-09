import { Box, Stack } from "@mui/material";

import { useAuth } from "../../auth/AuthContext";
import { StatusFeedback } from "../../components/StatusFeedback";
import { UserCreateForm } from "./UserCreateForm";
import { UserResetPasswordDialog } from "./UserResetPasswordDialog";
import { UserRoleDialog } from "./UserRoleDialog";
import { UsersDirectory } from "./UsersDirectory";
import { UsersFiltersPanel } from "./UsersFiltersPanel";
import { UsersHero } from "./UsersHero";
import { UsersSummaryCards } from "./UsersSummaryCards";
import { useUsersData } from "./useUsersData";

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const users = useUsersData({ currentUserId: currentUser?.id });

  return (
    <>
      <UsersHero totalUsers={users.rows.length} userSummary={users.userSummary} />

      <Box
        sx={{
          alignItems: "start",
          display: "grid",
          gap: 2,
          gridTemplateAreas: {
            xs: `"summary" "feedback" "side" "directory"`,
            xl: `"summary side" "feedback side" "directory side"`,
          },
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            xl: "minmax(0, 1.6fr) minmax(340px, 0.8fr)",
          },
        }}
      >
        <Box sx={{ gridArea: "summary", minWidth: 0 }}>
          <UsersSummaryCards userSummary={users.userSummary} />
        </Box>

        <Box sx={{ gridArea: "feedback", minWidth: 0 }}>
          <StatusFeedback
            success={users.message}
            error={users.error}
            onSuccessClose={users.clearMessage}
            onErrorClose={users.clearError}
          />
        </Box>

        <Stack
          spacing={2}
          sx={{
            gridArea: "side",
            minWidth: 0,
            position: { xl: "sticky" },
            top: { xl: 88 },
          }}
        >
          <UserCreateForm
            createUserDisabledReason={users.createUserDisabledReason}
            form={users.form}
            formIsInvalid={users.formIsInvalid}
            isCreating={users.isCreating}
            onFormChange={users.setForm}
            onSubmit={users.submit}
          />

          <UsersFiltersPanel
            anyFilterActive={users.anyFilterActive}
            filteredCount={users.filteredRows.length}
            onClearFilters={users.clearFilters}
            onQueryChange={users.setQuery}
            onRoleFilterChange={users.setRoleFilter}
            onStatusFilterChange={users.setStatusFilter}
            query={users.query}
            roleFilter={users.roleFilter}
            roleFilterLabel={users.roleFilterLabel}
            statusFilter={users.statusFilter}
            statusFilterLabel={users.statusFilterLabel}
            totalCount={users.rows.length}
          />
        </Stack>

        <Box sx={{ gridArea: "directory", minWidth: 0 }}>
          <UsersDirectory
            actionsAreBusy={users.actionsAreBusy}
            anyFilterActive={users.anyFilterActive}
            currentUserId={currentUser?.id}
            filteredRows={users.filteredRows}
            isLoading={users.isLoading}
            onClearFilters={users.clearFilters}
            onOpenResetPasswordDialog={users.openResetPasswordDialog}
            onOpenRoleDialog={users.openRoleDialog}
            onToggleUser={users.toggleUser}
            togglingUserId={users.togglingUserId}
            totalCount={users.rows.length}
          />
        </Box>
      </Box>

      <UserRoleDialog
        isUpdatingRole={users.isUpdatingRole}
        onClose={users.closeRoleDialog}
        onSave={users.saveUserRole}
        onSelectedRoleChange={users.setSelectedRole}
        selectedRole={users.selectedRole}
        user={users.roleDialogUser}
      />

      <UserResetPasswordDialog
        form={users.resetPasswordForm}
        isResettingPassword={users.isResettingPassword}
        onClose={users.closeResetPasswordDialog}
        onFormChange={users.setResetPasswordForm}
        onSave={users.saveResetPassword}
        passwordIsValid={users.resetPasswordIsValid}
        passwordMatches={users.resetPasswordMatches}
        resetPasswordIsInvalid={users.resetPasswordIsInvalid}
        user={users.resetPasswordUser}
      />
    </>
  );
}
