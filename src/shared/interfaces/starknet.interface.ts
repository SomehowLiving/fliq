export interface SplitBill {
  creator: bigint;
  total_amount: { low: bigint; high: bigint };
  description: bigint;
  created_at: bigint;
  is_settled: boolean;
  participant_count: number;
}

export interface TxMetadata {
  sender: bigint;
  receiver: bigint;
  message: bigint;
  is_public: boolean;
  timestamp: bigint;
}
