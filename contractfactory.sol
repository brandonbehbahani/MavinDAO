pragma solidity ^0.8.0;

import "./smartcontract.sol";

contract Factory {

    address[] tokenAddress;
       
    function deployContract(string name, string symbol) public {

            MavinDAO newDao = new MavinDAO(
                name,
                symbol
            );

            tokenAddress.push(address(newCredits));
            return newCredits;
        }

    }

}