export const successfulCallData = [
    {
        "block_id": 14073247,
        "transaction_hash": "0x1dd8de0c72b24e27b36d8a931414574ce3bf18b2d62c850fcf06d935143359a9",
        "index": "0",
        "time": "2022-01-25 06:47:48",
        "sender": "0xa976a66bfcbd5d71e6d0b7a0a3a9aa8eaa1b377a",
        "recipient": "0xbcd7254a1d759efa08ec7c3291b2e85c5dcc12ce",
        "value": 0,
        "value_usd": 0,
        "transferred": true
    },
    {
        "block_id": 14073225,
        "transaction_hash": "0xe4a8ba34c02991fe4f70598613e9798d78a88b343d41aa6e34a1f33d2d735ebb",
        "index": "0",
        "time": "2022-01-25 06:42:00",
        "sender": "0xa976a66bfcbd5d71e6d0b7a0a3a9aa8eaa1b377a",
        "recipient": "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45",
        "value": 250000000000000000,
        "value_usd": 609.9681,
        "transferred": true
    },
    {
        "block_id": 14034471,
        "transaction_hash": "0xd7bde83267d1c0b112b6d93e4e47d6830e2d99e7671d2f1e5d29d3707c0a9ce6",
        "index": "0",
        "time": "2022-01-19 06:54:44",
        "sender": "0xa976a66bfcbd5d71e6d0b7a0a3a9aa8eaa1b377a",
        "recipient": "0xbcd7254a1d759efa08ec7c3291b2e85c5dcc12ce",
        "value": 0,
        "value_usd": 0,
        "transferred": true
    },
    {
        "block_id": 14034468,
        "transaction_hash": "0xb5590aece6d06da54eccea1478262e3f5193905bfb72bde294611fc9f425ede4",
        "index": "0",
        "time": "2022-01-19 06:54:07",
        "sender": "0xa976a66bfcbd5d71e6d0b7a0a3a9aa8eaa1b377a",
        "recipient": "0xf4d2888d29d722226fafa5d9b24f9164c092421e",
        "value": 0,
        "value_usd": 0,
        "transferred": true
    },
    {
        "block_id": 14034460,
        "transaction_hash": "0xd59245c4201f8e4f4e92a1849b2475f7729c53b8575e4b454b3e18d575886e56",
        "index": "0",
        "time": "2022-01-19 06:52:44",
        "sender": "0xa976a66bfcbd5d71e6d0b7a0a3a9aa8eaa1b377a",
        "recipient": "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45",
        "value": 0,
        "value_usd": 0,
        "transferred": true
    }
];

export const emptyCallsData = [];

export const txListStubSuccessful = {
    "data": {
        "0xa976a66bfcbd5d71e6d0b7a0a3a9aa8eaa1b377a": {
            "address": {
                "type": "account",
                "contract_code_hex": null,
                "contract_created": null,
                "contract_destroyed": null,
                "balance": "1759674903173246059",
                "balance_usd": 4318.207018709339,
                "received_approximate": "5231187000000000000",
                "received_usd": 19647.0299,
                "spent_approximate": "2925965000000000000",
                "spent_usd": 10207.5973,
                "fees_approximate": "545547096826753941",
                "fees_usd": 1338.7616479182,
                "receiving_call_count": 19,
                "spending_call_count": 55,
                "call_count": 76,
                "transaction_count": 72,
                "first_seen_receiving": "2021-05-12 16:49:32",
                "last_seen_receiving": "2022-01-09 05:48:00",
                "first_seen_spending": "2021-05-12 18:55:22",
                "last_seen_spending": "2022-01-25 06:47:48",
                "nonce": null
            },
            "calls": successfulCallData
        }
    },
    "context": {
        "code": 200,
        "source": "D",
        "limit": "5,5",
        "offset": "1,1",
        "results": 1,
        "state": 14074856,
        "state_layer_2": 14074856,
        "market_price_usd": 2453.98,
        "cache": {
            "live": true,
            "duration": 180,
            "since": "2022-01-25 12:51:29",
            "until": "2022-01-25 12:54:29",
            "time": null
        },
        "api": {
            "version": "2.0.95-ie",
            "last_major_update": "2021-07-19 00:00:00",
            "next_major_update": null,
            "documentation": "https://blockchair.com/api/docs",
            "notice": ":)"
        },
        "servers": "API4,ETH3,ETH3",
        "time": 1.7783517837524414,
        "render_time": 0.0027332305908203125,
        "full_time": 1.7810850143432617,
        "request_cost": 1
    }
};

export const txListStubEmpty = {
    "data": {
        "0xa976a66bfcbd5d71e6d0b7a0a3a9aa8eaa1b377a": {
            "address": {
                "type": "account",
                "contract_code_hex": null,
                "contract_created": null,
                "contract_destroyed": null,
                "balance": "1759674903173246059",
                "balance_usd": 4318.207018709339,
                "received_approximate": "5231187000000000000",
                "received_usd": 19647.0299,
                "spent_approximate": "2925965000000000000",
                "spent_usd": 10207.5973,
                "fees_approximate": "545547096826753941",
                "fees_usd": 1338.7616479182,
                "receiving_call_count": 19,
                "spending_call_count": 55,
                "call_count": 76,
                "transaction_count": 72,
                "first_seen_receiving": "2021-05-12 16:49:32",
                "last_seen_receiving": "2022-01-09 05:48:00",
                "first_seen_spending": "2021-05-12 18:55:22",
                "last_seen_spending": "2022-01-25 06:47:48",
                "nonce": null
            },
            "calls": emptyCallsData
        }
    },
    "context": {
        "code": 200,
        "source": "D",
        "limit": "5,5",
        "offset": "2,2",
        "results": 1,
        "state": 14074856,
        "state_layer_2": 14074856,
        "market_price_usd": 2453.98,
        "cache": {
            "live": true,
            "duration": 180,
            "since": "2022-01-25 12:51:29",
            "until": "2022-01-25 12:54:29",
            "time": null
        },
        "api": {
            "version": "2.0.95-ie",
            "last_major_update": "2021-07-19 00:00:00",
            "next_major_update": null,
            "documentation": "https://blockchair.com/api/docs",
            "notice": ":)"
        },
        "servers": "API4,ETH3,ETH3",
        "time": 1.7783517837524414,
        "render_time": 0.0027332305908203125,
        "full_time": 1.7810850143432617,
        "request_cost": 1
    }
};