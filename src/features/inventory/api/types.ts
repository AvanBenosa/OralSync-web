export type InventoryProps = {
  clinicId?: string;
};

export enum InventoryCategory {
  Consumables = 'Consumables',
  Medicines = 'Medicines',
  Instruments = 'Instruments',
  Equipment = 'Equipment',
  CleaningSupplies = 'CleaningSupplies',
  OfficeSupplies = 'OfficeSupplies',
  LaboratoryMaterials = 'LaboratoryMaterials',
  Others = 'Others',
}

export enum InventoryType {
  Material = 'Material',
  Tool = 'Tool',
  Drug = 'Drug',
  Disposable = 'Disposable',
  Asset = 'Asset',
}

export const INVENTORY_CATEGORY_OPTIONS = Object.values(InventoryCategory);
export const INVENTORY_TYPE_OPTIONS = Object.values(InventoryType);

export const INVENTORY_CATEGORY_LABELS: Record<InventoryCategory, string> = {
  [InventoryCategory.Consumables]: 'Consumables',
  [InventoryCategory.Medicines]: 'Medicines',
  [InventoryCategory.Instruments]: 'Instruments',
  [InventoryCategory.Equipment]: 'Equipment',
  [InventoryCategory.CleaningSupplies]: 'Cleaning Supplies',
  [InventoryCategory.OfficeSupplies]: 'Office Supplies',
  [InventoryCategory.LaboratoryMaterials]: 'Laboratory Materials',
  [InventoryCategory.Others]: 'Others',
};

export const INVENTORY_TYPE_LABELS: Record<InventoryType, string> = {
  [InventoryType.Material]: 'Material',
  [InventoryType.Tool]: 'Tool',
  [InventoryType.Drug]: 'Drug',
  [InventoryType.Disposable]: 'Disposable',
  [InventoryType.Asset]: 'Asset',
};

export type InventoryModel = {
  id?: string;
  clinicProfileId?: string | null;
  itemCode?: string;
  name?: string;
  description?: string;
  category?: InventoryCategory;
  type?: InventoryType;
  quantityOnHand?: number;
  minimumStockLevel?: number;
  maximumStockLevel?: number;
  unitOfMeasure?: string;
  unitCost?: number;
  sellingPrice?: number;
  totalValue?: number;
  supplierName?: string;
  supplierContactNumber?: string;
  supplierEmail?: string;
  batchNumber?: string;
  manufacturingDate?: string | Date;
  expirationDate?: string | Date;
  lastRestockedDate?: string | Date;
  lastUsedDate?: string | Date;
  usageCount?: number;
  isLowStock?: boolean;
  isExpired?: boolean;
  isActive?: boolean;
};

export type InventoryResponseModel = {
  items: InventoryModel[];
  pageStart: number;
  pageEnd: number;
  totalCount: number;
};

export type InventoryStateModel = {
  items: InventoryModel[];
  load: boolean;
  initial: number;
  totalItem: number;
  pageStart: number;
  pageEnd: number;
  search?: string;
  openModal: boolean;
  isUpdate: boolean;
  isDelete: boolean;
  selectedItem?: InventoryModel;
  clinicProfileId?: string | null;
};

export type InventoryStateProps = {
  state: InventoryStateModel;
  setState: Function;
  onReload?: () => void;
};

export const getInventoryCategoryLabel = (category?: InventoryCategory | string): string => {
  if (!category) {
    return '--';
  }

  return (
    INVENTORY_CATEGORY_LABELS[category as InventoryCategory] ??
    String(category).replace(/([a-z])([A-Z])/g, '$1 $2')
  );
};

export const getInventoryTypeLabel = (type?: InventoryType | string): string => {
  if (!type) {
    return '--';
  }

  return (
    INVENTORY_TYPE_LABELS[type as InventoryType] ?? String(type).replace(/([a-z])([A-Z])/g, '$1 $2')
  );
};
