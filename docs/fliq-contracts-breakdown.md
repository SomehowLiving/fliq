# Fliq Contracts - Complete Breakdown

## Overview
Fliq is a social payments dApp with three core contracts that work together to enable username-based payments, bill splitting, and transaction social features.

---

## 1. UsernameRegistry Contract

### Purpose
**Human-readable usernames for Starknet addresses** (like ENS for Starknet)

### Key Functions
- `register_username()` - Claim a username for your wallet address
- `get_address()` - Find wallet address from username  
- `get_username()` - Find username from wallet address
- `is_username_available()` - Check if username is free

### Storage
- `username_to_address` - Map usernames → wallet addresses
- `address_to_username` - Map wallet addresses → usernames  
- `username_exists` - Track taken usernames

### Features
- One username per wallet address
- Username updates (automatically frees old username)
- Prevents empty usernames
- Prevents duplicate usernames

---

## 2. SplitBillManager Contract

### Purpose
**Split expenses between friends with tracking and payments**

### Key Functions
- `create_bill()` - Create a new bill with participants and amounts
- `pay_share()` - Pay your portion of a bill
- `get_bill()` - Get bill details
- `has_paid()` - Check if participant paid
- `get_amount_owed()` - Get owed amount for participant

### Storage
- `bills` - Store all bill information
- `participant_paid` - Track who has paid
- `participant_amount` - Track how much each owes
- `next_bill_id` - Auto-incrementing bill counter
- `usdc_token` - USDC contract address for payments

### Bill Structure
```cairo
Bill {
    creator: who created the bill,
    total_amount: total bill amount,
    description: what the bill is for,
    created_at: timestamp,
    is_settled: whether bill is fully paid,
    participant_count: how many people involved
}
```

### Features
- Enforces amounts sum to total
- Prevents double payments
- Tracks payment status
- Supports multiple participants

---

## 3. TransactionMetadata Contract

### Purpose
**Add social context to transactions** (messages, visibility settings)

### Key Functions
- `add_metadata()` - Attach social data to a transaction
- `get_metadata()` - Retrieve transaction social data  
- `is_public()` - Check if transaction is publicly visible

### Storage
- `transaction_metadata` - Map transaction hashes → social data

### Metadata Structure
```cairo
TxMetadata {
    sender: who sent the transaction,
    receiver: who received it,
    message: attached note/message,
    is_public: visible to others?,
    timestamp: when it was sent
}
```

### Features
- Attach messages to payments
- Control transaction visibility
- Timestamp tracking
- Transaction history with context

---

## How They Work Together

1. **User Onboarding**
   - Register username in `UsernameRegistry`
   - Now payable via username instead of raw address

2. **Social Payments**  
   - Send payment using friend's username
   - Add message/context via `TransactionMetadata`
   - Split group expenses via `SplitBillManager`

3. **Bill Management**
   - Create bill with multiple participants
   - Each pays their share
   - Track who paid via payment status

4. **Social Features**
   - See transaction messages/history
   - Public/private transaction visibility
   - Username-based addressing

---

## Real-World Use Cases

- **Roommate expenses** - Split rent, utilities, groceries
- **Group dinners** - Split restaurant bills  
- **Event costs** - Split tickets, transportation
- **Gifts** - Send payments with personal messages
- **Business expenses** - Track team spending

This creates a complete social payments ecosystem on Starknet! 🚀