const useGetReceiptDetails = (stall_name: string) => {
  switch (stall_name) {
    case 'Main Stall':
      return {
        address:
          'A-02 MRL Building, Mc. Arthur Hiway, Mabiga, Mabalacat City, Pampanga, 2010',
        shop_name: 'RVDC REF & AIRCON REPAIR SHOP ',
        tin_id: '282-417-631-00000',
      }

    case 'Sub Stall':
      return {
        address:
          'A-03 MRL Building, Mc. Arthur Hiway, Mabiga, Mabalacat City, Pampanga, 2010',
        shop_name: 'RVDC APPLIANCES PARTS & ACCESORIES TRADING',
        tin_id: '470-330-326-00000',
      }

    default:
      return {
        address:
          'A-02 MRL Building, Mc. Arthur Hiway, Mabiga, Mabalacat City, Pampanga, 2010',
        shop_name: 'RVDC REF & AIRCON REPAIR SHOP ',
        tin_id: '282-417-631-00000',
      }
  }
}

export default useGetReceiptDetails
