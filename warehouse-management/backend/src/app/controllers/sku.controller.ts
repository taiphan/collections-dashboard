import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { skuService } from '../../domain/sku/sku.service.js';

const createSkuSchema = z.object({
  code: z.string().min(4).max(50).regex(/^[a-zA-Z0-9]+$/, 'SKU code must be alphanumeric'),
  size: z.string().max(50).optional(),
  color: z.string().max(30).optional(),
  weight: z.number().min(0.01).max(99999.99).optional(),
});

const addBarcodeSchema = z.object({
  value: z.string().min(1).max(80),
});

export class SkuController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { itemId } = req.params as { itemId: string };
      const input = createSkuSchema.parse(req.body);
      const sku = await skuService.create(itemId, input, req.user!.userId);
      res.status(201).json({ success: true, data: sku });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const sku = await skuService.findById(id);
      res.json({ success: true, data: sku });
    } catch (err) {
      next(err);
    }
  }

  async listByCatalogItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { itemId } = req.params as { itemId: string };
      const skus = await skuService.findByCatalogItem(itemId);
      res.json({ success: true, data: skus });
    } catch (err) {
      next(err);
    }
  }

  async addBarcode(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const input = addBarcodeSchema.parse(req.body);
      const barcode = await skuService.addBarcode(id, input, req.user!.userId);
      res.status(201).json({ success: true, data: barcode });
    } catch (err) {
      next(err);
    }
  }

  async removeBarcode(req: Request, res: Response, next: NextFunction) {
    try {
      const { skuId, barcodeId } = req.params as { skuId: string; barcodeId: string };
      await skuService.removeBarcode(skuId, barcodeId, req.user!.userId);
      res.json({ success: true, message: 'Barcode removed' });
    } catch (err) {
      next(err);
    }
  }

  async lookupBarcode(req: Request, res: Response, next: NextFunction) {
    try {
      const { value } = req.params as { value: string };
      const result = await skuService.lookupByBarcode(value);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const skuController = new SkuController();
