SELECT BOOKPAGE, SerialNbr, Class, PropType
	, Region, District, Neighbor
	, Quality, YrBuilt, FloorArea, LotSize
	, SaleDate, SALEPRICE, ADJUSTMENT, AdjustPrice
	, MktLand, MktImprove
	, AcceptCD
FROM dbo.tblSRMain
WHERE County = 'DU'
	AND SaleDate BETWEEN '2025-01-01' AND '2025-12-31'
	AND Cleaned = 'Y'
ORDER BY Class