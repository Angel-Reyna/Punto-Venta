import { PERMISSIONS } from "../../auth/permissions";
import { useAuth } from "../../auth/AuthContext";
import { PageHeader } from "../../components/PageHeader";
import { StatusFeedback } from "../../components/StatusFeedback";
import { CashControlHero } from "./CashControlHero";
import { CashManualMovementPanel } from "./CashManualMovementPanel";
import { CashMovementsSection } from "./CashMovementsSection";
import { CashSessionCards } from "./CashSessionCards";
import {
  getCloseRegisterDisabledReason,
  getManualMovementDisabledReason,
  getOpenRegisterDisabledReason,
  isManualMovementSubmitDisabled,
} from "./cashRegisterShared";
import { useCashRegisterData } from "./useCashRegisterData";

export function CashRegisterPage() {
  const { can } = useAuth();

  const canOperateCashRegister = can(PERMISSIONS.CashRegisterOperate);
  const canManageCashRegister = can(PERMISSIONS.CashRegisterManage);
  const canReadCashRegisterSessions = can(PERMISSIONS.CashRegisterRead);

  const cashRegister = useCashRegisterData({
    canManageCashRegister,
    canOperateCashRegister,
    canReadCashRegisterSessions,
  });

  const openRegisterDisabledReason = getOpenRegisterDisabledReason({
    canOperateCashRegister,
    currentSession: cashRegister.currentSession,
    isLoading: cashRegister.isLoading,
  });

  const closeRegisterDisabledReason = getCloseRegisterDisabledReason({
    canOperateCashRegister,
    currentSession: cashRegister.currentSession,
    isLoading: cashRegister.isLoading,
  });

  const manualMovementDisabledReason = getManualMovementDisabledReason({
    canOperateCashRegister,
    currentSession: cashRegister.currentSession,
    isLoading: cashRegister.isLoading,
    movementAmount: cashRegister.movementAmount,
    movementReason: cashRegister.movementReason,
  });

  const manualMovementSubmitDisabled = isManualMovementSubmitDisabled({
    canOperateCashRegister,
    currentSession: cashRegister.currentSession,
    isLoading: cashRegister.isLoading,
    movementAmount: cashRegister.movementAmount,
    movementReason: cashRegister.movementReason,
  });

  return (
    <>
      <PageHeader
        title="Caja"
        subtitle="Controla cortes y entregas de efectivo sin bloquear el registro de ventas."
      />

      <CashControlHero
        canReadCashRegisterSessions={canReadCashRegisterSessions}
        currentSession={cashRegister.currentSession}
      />

      <StatusFeedback
        success={cashRegister.message}
        error={cashRegister.error}
        onSuccessClose={() => cashRegister.setMessage("")}
        onErrorClose={() => cashRegister.setError("")}
      />

      <CashSessionCards
        canOperateCashRegister={canOperateCashRegister}
        closeRegister={cashRegister.closeRegister}
        closeRegisterDisabledReason={closeRegisterDisabledReason}
        closingAmount={cashRegister.closingAmount}
        closingNotes={cashRegister.closingNotes}
        currentSession={cashRegister.currentSession}
        isLoading={cashRegister.isLoading}
        openRegister={cashRegister.openRegister}
        openRegisterDisabledReason={openRegisterDisabledReason}
        openingAmount={cashRegister.openingAmount}
        openingNotes={cashRegister.openingNotes}
        setClosingAmount={cashRegister.setClosingAmount}
        setClosingNotes={cashRegister.setClosingNotes}
        setOpeningAmount={cashRegister.setOpeningAmount}
        setOpeningNotes={cashRegister.setOpeningNotes}
      />

      {canManageCashRegister && (
        <CashManualMovementPanel
          addManualMovement={cashRegister.addManualMovement}
          canOperateCashRegister={canOperateCashRegister}
          currentSession={cashRegister.currentSession}
          manualMovementDisabledReason={manualMovementDisabledReason}
          manualMovementSubmitDisabled={manualMovementSubmitDisabled}
          movementAmount={cashRegister.movementAmount}
          movementReason={cashRegister.movementReason}
          movementType={cashRegister.movementType}
          setMovementAmount={cashRegister.setMovementAmount}
          setMovementReason={cashRegister.setMovementReason}
          setMovementType={cashRegister.setMovementType}
        />
      )}

      <CashMovementsSection
        canReadCashRegisterSessions={canReadCashRegisterSessions}
        currentSession={cashRegister.currentSession}
        isLoading={cashRegister.isLoading}
        sessions={cashRegister.sessions}
      />
    </>
  );
}
