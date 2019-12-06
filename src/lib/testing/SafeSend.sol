pragma solidity ^0.5.9;

contract SafeSend {
  address public recipient;
  
  constructor(address _recipient) payable {
    recipient = _recipient;
  }

  function deliver() {
    selfdestruct(recipient);
  }
}
