contract("Example", function(accounts) {
  it("should assert true", function(done) {
    let example = Example.deployed();
    assert.isTrue(true);
    done();
  });
});
