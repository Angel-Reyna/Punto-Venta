import { useMemo } from "react";

import { DataGridCard } from "../../components/DataGridCard";
import {
  buildCurrentMovementsColumns,
  buildSessionColumns,
  type CashRegisterSession,
} from "./cashRegisterShared";

export function CashMovementsSection({
  canReadCashRegisterSessions,
  currentSession,
  isLoading,
  sessions,
}: {
  canReadCashRegisterSessions: boolean;
  currentSession: CashRegisterSession | null;
  isLoading: boolean;
  sessions: CashRegisterSession[];
}) {
  const currentMovementsColumns = useMemo(buildCurrentMovementsColumns, []);
  const sessionColumns = useMemo(buildSessionColumns, []);

  return (
    <>
      <DataGridCard
        title="Movimientos de la caja actual"
        rows={currentSession?.movements ?? []}
        columns={currentMovementsColumns}
        minWidth={840}
        loading={isLoading}
        cardSx={{ mb: 2 }}
        noRowsLabel="No hay movimientos en la caja actual."
        tableLabel="Movimientos de la caja actual"
      />

      {canReadCashRegisterSessions && (
        <DataGridCard
          title="Cortes recientes"
          rows={sessions}
          columns={sessionColumns}
          minWidth={1120}
          loading={isLoading}
          noRowsLabel="No hay cortes de caja registrados."
          tableLabel="Cortes recientes"
        />
      )}
    </>
  );
}
