// ============================================
// FLIQ CONTRACTS - ALL IN ONE
// ============================================

use starknet::ContractAddress;

// ============================================
// SHARED INTERFACES
// ============================================

#[starknet::interface]
trait IUsernameRegistry<TContractState> {
    fn register_username(ref self: TContractState, username: felt252);
    fn get_address(self: @TContractState, username: felt252) -> ContractAddress;
    fn get_username(self: @TContractState, address: ContractAddress) -> felt252;
    fn is_username_available(self: @TContractState, username: felt252) -> bool;
}

#[starknet::interface]
trait ISplitBillManager<TContractState> {
    fn create_bill(
        ref self: TContractState,
        total_amount: u256,
        description: felt252,
        participants: Span<ContractAddress>,
        amounts: Span<u256>
    ) -> u256;
    fn pay_share(ref self: TContractState, bill_id: u256);
    fn get_bill(self: @TContractState, bill_id: u256) -> Bill;
    fn has_paid(self: @TContractState, bill_id: u256, participant: ContractAddress) -> bool;
    fn get_amount_owed(self: @TContractState, bill_id: u256, participant: ContractAddress) -> u256;
}

#[starknet::interface]
trait ITransactionMetadata<TContractState> {
    fn add_metadata(
        ref self: TContractState,
        tx_hash: felt252,
        receiver: ContractAddress,
        message: felt252,
        is_public: bool,
        timestamp: u64
    );
    fn get_metadata(self: @TContractState, tx_hash: felt252) -> TxMetadata;
    fn is_public(self: @TContractState, tx_hash: felt252) -> bool;
}

// ============================================
// SHARED STRUCTS
// ============================================

#[derive(Drop, Serde, starknet::Store)]
struct Bill {
    creator: ContractAddress,
    total_amount: u256,
    description: felt252,
    created_at: u64,
    is_settled: bool,
    participant_count: u32,
}

#[derive(Drop, Serde, starknet::Store)]
struct TxMetadata {
    sender: ContractAddress,
    receiver: ContractAddress,
    message: felt252,
    is_public: bool,
    timestamp: u64,
}

// ============================================
// 1. USERNAME REGISTRY CONTRACT
// ============================================

#[starknet::contract]
mod UsernameRegistry {
    use super::{ContractAddress, IUsernameRegistry};
    use starknet::get_caller_address;
    use starknet::storage::{Map, StorageMapReadAccess, StorageMapWriteAccess};
    use core::num::traits::Zero;

    #[storage]
    struct Storage {
        username_to_address: Map<felt252, ContractAddress>,
        address_to_username: Map<ContractAddress, felt252>,
        username_exists: Map<felt252, bool>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        UsernameRegistered: UsernameRegistered,
        UsernameUpdated: UsernameUpdated,
    }

    #[derive(Drop, starknet::Event)]
    struct UsernameRegistered {
        username: felt252,
        owner: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct UsernameUpdated {
        old_username: felt252,
        new_username: felt252,
        owner: ContractAddress,
    }

    #[constructor]
    fn constructor(ref self: ContractState) {}

    #[abi(embed_v0)]
    impl UsernameRegistryImpl of IUsernameRegistry<ContractState> {
        fn register_username(ref self: ContractState, username: felt252) {
            let caller = get_caller_address();
            
            assert(username != 0, 'Username cannot be empty');
            assert(!self.username_exists.read(username), 'Username already taken');
            
            let existing_username = self.address_to_username.read(caller);
            
            if existing_username != 0 {
                self.username_exists.write(existing_username, false);
                self.username_to_address.write(existing_username, Zero::zero());
                
                self.emit(UsernameUpdated {
                    old_username: existing_username,
                    new_username: username,
                    owner: caller,
                });
            } else {
                self.emit(UsernameRegistered {
                    username: username,
                    owner: caller,
                });
            }
            
            self.username_to_address.write(username, caller);
            self.address_to_username.write(caller, username);
            self.username_exists.write(username, true);
        }

        fn get_address(self: @ContractState, username: felt252) -> ContractAddress {
            self.username_to_address.read(username)
        }

        fn get_username(self: @ContractState, address: ContractAddress) -> felt252 {
            self.address_to_username.read(address)
        }

        fn is_username_available(self: @ContractState, username: felt252) -> bool {
            !self.username_exists.read(username)
        }
    }
}

// ============================================
// 2. SPLIT BILL CONTRACT
// ============================================

#[starknet::contract]
mod SplitBillManager {
    use super::{ContractAddress, ISplitBillManager, Bill};
    use starknet::{get_caller_address, get_block_timestamp};
    use starknet::storage::{Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess, StoragePointerWriteAccess};

    #[storage]
    struct Storage {
        bills: Map<u256, Bill>,
        next_bill_id: u256,
        usdc_token: ContractAddress,
        participant_paid: Map<(u256, ContractAddress), bool>,
        participant_amount: Map<(u256, ContractAddress), u256>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        BillCreated: BillCreated,
        PaymentMade: PaymentMade,
        BillSettled: BillSettled,
    }

    #[derive(Drop, starknet::Event)]
    struct BillCreated {
        bill_id: u256,
        creator: ContractAddress,
        total_amount: u256,
        participant_count: u32,
    }

    #[derive(Drop, starknet::Event)]
    struct PaymentMade {
        bill_id: u256,
        payer: ContractAddress,
        amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct BillSettled {
        bill_id: u256,
    }

    #[constructor]
    fn constructor(ref self: ContractState, usdc_token_address: ContractAddress) {
        self.usdc_token.write(usdc_token_address);
        self.next_bill_id.write(1);
    }

    #[abi(embed_v0)]
    impl SplitBillManagerImpl of ISplitBillManager<ContractState> {
        fn create_bill(
            ref self: ContractState,
            total_amount: u256,
            description: felt252,
            participants: Span<ContractAddress>,
            amounts: Span<u256>
        ) -> u256 {
            let caller = get_caller_address();
            let bill_id = self.next_bill_id.read();
            
            assert(participants.len() > 0, 'Need at least 1 participant');
            assert(participants.len() == amounts.len(), 'Mismatched arrays');
            
            let mut sum: u256 = 0;
            let mut i: u32 = 0;
            loop {
                if i >= amounts.len() {
                    break;
                }
                sum += *amounts.at(i);
                i += 1;
            };
            assert(sum == total_amount, 'Amounts dont match total');
            
            let bill = Bill {
                creator: caller,
                total_amount,
                description,
                created_at: get_block_timestamp(),
                is_settled: false,
                participant_count: participants.len(),
            };
            self.bills.write(bill_id, bill);
            
            let mut j: u32 = 0;
            loop {
                if j >= participants.len() {
                    break;
                }
                let participant = *participants.at(j);
                let amount = *amounts.at(j);
                self.participant_amount.write((bill_id, participant), amount);
                self.participant_paid.write((bill_id, participant), false);
                j += 1;
            };
            
            self.next_bill_id.write(bill_id + 1);
            
            self.emit(BillCreated {
                bill_id,
                creator: caller,
                total_amount,
                participant_count: participants.len(),
            });
            
            bill_id
        }

        fn pay_share(ref self: ContractState, bill_id: u256) {
            let caller = get_caller_address();
            let bill = self.bills.read(bill_id);
            
            assert(!bill.is_settled, 'Bill already settled');
            assert(!self.participant_paid.read((bill_id, caller)), 'Already paid');
            
            let amount = self.participant_amount.read((bill_id, caller));
            assert(amount > 0, 'Not a participant');
            
            self.participant_paid.write((bill_id, caller), true);
            
            // Transfer USDC to bill creator
            // IUSDC(self.usdc_token.read()).transfer_from(caller, bill.creator, amount);
            
            self.emit(PaymentMade {
                bill_id,
                payer: caller,
                amount,
            });
        }

        fn get_bill(self: @ContractState, bill_id: u256) -> Bill {
            self.bills.read(bill_id)
        }

        fn has_paid(self: @ContractState, bill_id: u256, participant: ContractAddress) -> bool {
            self.participant_paid.read((bill_id, participant))
        }

        fn get_amount_owed(self: @ContractState, bill_id: u256, participant: ContractAddress) -> u256 {
            self.participant_amount.read((bill_id, participant))
        }
    }
}

// ============================================
// 3. TRANSACTION METADATA CONTRACT
// ============================================

#[starknet::contract]
mod TransactionMetadata {
    use super::{ContractAddress, ITransactionMetadata, TxMetadata};
    use starknet::get_caller_address;
    use starknet::storage::{Map, StorageMapReadAccess, StorageMapWriteAccess};

    #[storage]
    struct Storage {
        transaction_metadata: Map<felt252, TxMetadata>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        MetadataAdded: MetadataAdded,
    }

    #[derive(Drop, starknet::Event)]
    struct MetadataAdded {
        tx_hash: felt252,
        sender: ContractAddress,
        receiver: ContractAddress,
    }

    #[constructor]
    fn constructor(ref self: ContractState) {}

    #[abi(embed_v0)]
    impl TransactionMetadataImpl of ITransactionMetadata<ContractState> {
        fn add_metadata(
            ref self: ContractState,
            tx_hash: felt252,
            receiver: ContractAddress,
            message: felt252,
            is_public: bool,
            timestamp: u64
        ) {
            let caller = get_caller_address();
            
            let metadata = TxMetadata {
                sender: caller,
                receiver,
                message,
                is_public,
                timestamp,
            };
            
            self.transaction_metadata.write(tx_hash, metadata);
            
            self.emit(MetadataAdded {
                tx_hash,
                sender: caller,
                receiver,
            });
        }

        fn get_metadata(self: @ContractState, tx_hash: felt252) -> TxMetadata {
            self.transaction_metadata.read(tx_hash)
        }

        fn is_public(self: @ContractState, tx_hash: felt252) -> bool {
            self.transaction_metadata.read(tx_hash).is_public
        }
    }
}