import { Stack } from "@mui/material";

import { useAuth } from "../../auth/AuthContext";
import { StatusFeedback } from "../../components/StatusFeedback";
import { UserCreateForm } from "./UserCreateForm";
import { UserResetPasswordDialog } from "./UserResetPasswordDialog";
import { UserRoleDialog } from "./UserRoleDialog";
import { UsersDirectory } from "./UsersDirectory";
import { UsersFiltersPanel } from "./UsersFiltersPanel";
import { UsersHero } from "./UsersHero";
import { useUsersData } from "./useUsersData";

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const users = useUsersData({ currentUserId: currentUser?.id });

  return (
    <>
      <UsersHero totalUsers={users.rows.length} userSummary={users.userSummary} />

      <Stack spacing={1.5}>
        <StatusFeedback
          success={users.message}
          error={users.error}
          onSuccessClose={users.clearMessage}
          onErrorClose={users.clearError}
        />

        <UserCreateForm
          createUserDisabledReason={users.createUserDisabledReason}
          form={users.form}
          formIsInvalid={users.formIsInvalid}
          isCreating={users.isCreating}
          onFormChange={users.setForm}
          onSubmit={users.submit}
        />

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
          controls={
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
              userSummary={users.userSummary}
            />
          }
        />
      </Stack>

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
