import { EmergencyFundStatus } from '../../../components/EmergencyFundStatus';

export function EmergencyFundCard({ emergencyFund }) {
  return <EmergencyFundStatus metrics={emergencyFund} variant="card" />;
}
