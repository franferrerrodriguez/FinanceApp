import { supabase, supabaseConfigured } from './supabase';

export async function deleteAssetFromCloud(userId, assetId) {
  if (!supabaseConfigured || !supabase || !userId || !assetId) return;

  const { error: snapError } = await supabase
    .from('monthly_snapshots')
    .delete()
    .eq('user_id', userId)
    .eq('asset_id', assetId);
  if (snapError) console.error('deleteAssetFromCloud snapshots:', snapError);

  const { error } = await supabase
    .from('assets')
    .delete()
    .eq('id', assetId)
    .eq('user_id', userId);
  if (error) console.error('deleteAssetFromCloud:', error);
}

export async function deleteLiabilityFromCloud(userId, liabilityId) {
  if (!supabaseConfigured || !supabase || !userId || !liabilityId) return;

  const { error: snapError } = await supabase
    .from('monthly_snapshots')
    .delete()
    .eq('user_id', userId)
    .eq('liability_id', liabilityId);
  if (snapError) console.error('deleteLiabilityFromCloud snapshots:', snapError);

  const { error } = await supabase
    .from('liabilities')
    .delete()
    .eq('id', liabilityId)
    .eq('user_id', userId);
  if (error) console.error('deleteLiabilityFromCloud:', error);
}
