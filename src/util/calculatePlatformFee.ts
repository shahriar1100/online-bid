// export const calculatePlatformFee=()=>{

//       const fixed=495;
//       const amount=sessionData.winning_bid
//       const onePercentOfWinningBid=sessionData.winning_bid!*0.01;
      
//       switch(sessionData.listing_type){
//         case "realestate":
//           return(Math.max(fixed,onePercentOfWinningBid));
//         case "automobile":
//           return Number((amount!*0.05).toFixed(2));


//         case "business":
//           return Number((amount!*0.04).toFixed(2))

//         case "rent":
//           return Number((amount!*0.03).toFixed(2))
//         default:
//           return Number(495);

//       }
//     }



export type ListingType = "realestate" | "automobile" | "business" | "rent";

export function calculatePlatformFee(amount: number, listingType: ListingType): number {
  const FIXED_FEE = 495;
  const onePercent = amount * 0.01;

  switch (listingType) {
    case "realestate":
      return Math.max(FIXED_FEE, onePercent);
    case "automobile":
      return Number((amount * 0.05).toFixed(2));
    case "business":
      return Number((amount * 0.04).toFixed(2));
    case "rent":
      return Number((amount * 0.03).toFixed(2));
    default:
      return FIXED_FEE;
  }
}