// floor(log2(n)), n >= 1
function ilog2(n) {
  let i = 0n;
  while (n >= 2n**(2n**i)) {
    i += 1n;
  }
  let e = 0n;
  let t = 1n;
  while (i >= 0n) {
    let b = 2n**i;
    if (n >= t * 2n**b) {
      t *= 2n**b;
      e += b;
    }
    i -= 1n;
  }
  return e;
}

// floor(sqrt(S)), S >= 0, https://en.wikipedia.org/wiki/Methods_of_computing_square_roots#Babylonian_method
function sqrt(S) {
  let e = ilog2(S);
  if (e < 2n) {
    return 1n;
  }
  let f = e / 4n + 1n;
  let x = (sqrt(S / 2n**(f * 2n)) + 1n) * 2n**f;
  let xprev = x + 1n;
  while (xprev > x) {
    xprev = x;
    x = (x + S / x) / 2n;
  }
  return xprev;
}

function squareRoot(value, decimalDigits) {
  return (sqrt(BigInt(value) * 10n**(BigInt(decimalDigits) * 2n + 2n)) + 5n).toString();
}
