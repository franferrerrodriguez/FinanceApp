import { EmergencyFundStatus } from '../../../components/EmergencyFundStatus';

export function EmergencyFundCard({ emergencyFund }) {
  if (!emergencyFund?.hasLiquidData) return null;
  return <EmergencyFundStatus metrics={emergencyFund} variant="card" />;
}
