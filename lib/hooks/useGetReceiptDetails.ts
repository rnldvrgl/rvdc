const useGetReceiptDetails = (stall_name: string) => {
  const normalized = stall_name.toLowerCase().trim()

  if (normalized === "sub" || normalized === "sub stall") {
    return {
      address:
        "A-03 MRL Building, Mc. Arthur Hiway, Mabiga, Mabalacat City, Pampanga, 2010",
      shop_name: "RVDC APPLIANCES PARTS & ACCESSORIES TRADING",
      tin_id: "470-330-326-00000",
    }
  }

  // Main stall (default)
  return {
    address:
      "A-02 MRL Building, Mc. Arthur Hiway, Mabiga, Mabalacat City, Pampanga, 2010",
    shop_name: "RVDC REF & AIRCON REPAIR SHOP",
    tin_id: "282-417-631-00000",
  }
}

export default useGetReceiptDetails
