const database = require('../config/database');
const db = require('../config/database');

class ProductEAV {
  static async getAttributeId(code) {
    const query = 'SELECT attribute_id FROM attribute WHERE code = ?';
    try {
      const [rows] = await db.execute(query, [code]);
      return rows[0]?.attribute_id || null;
    } catch (error) {
      console.error(`Error getting attribute ID for ${code}:`, error);
      return null;
    }
  }

  static async isClothesProduct(entityId) {
    const query = `
      SELECT COUNT(*) as count 
      FROM category_product cp
      JOIN category c ON cp.category_id = c.category_id
      WHERE cp.product_id = ? AND (c.name = 'Clothes' OR c.parent_id IN (
        SELECT category_id FROM category WHERE name = 'Clothes'
      ))
    `;
    try {
      const [rows] = await db.execute(query, [entityId]);
      return rows[0].count > 0;
    } catch (error) {
      console.error('Error checking clothes category:', error);
      return false;
    }
  }

  static async findAll(page = 1, limit = 8) {
    const offset = (page - 1) * limit;

    const query = `
      SELECT DISTINCT
        pe.entity_id,
        pe.sku,
        u.name as seller_name,
        u.user_id as seller_id,
        -- Name
        pv_name.value as name,
        -- Price  
        pd_price.value as price,
        -- Image
        pv_image.value as image_path,
        -- Description
        pt_desc.value as description,
        -- Status
        pi_status.value as status,
        -- Categories
        GROUP_CONCAT(DISTINCT c.name SEPARATOR ', ') as categories
      FROM product_entity pe
      
      -- Join name (varchar)
      LEFT JOIN product_entity_varchar pv_name 
        ON pe.entity_id = pv_name.entity_id 
        AND pv_name.attribute_id = 1
      
      -- Join price (decimal)
      LEFT JOIN product_entity_decimal pd_price 
        ON pe.entity_id = pd_price.entity_id 
        AND pd_price.attribute_id = 2
        
      -- Join image (varchar)
      LEFT JOIN product_entity_varchar pv_image 
        ON pe.entity_id = pv_image.entity_id 
        AND pv_image.attribute_id = 3
        
      -- Join description (text)
      LEFT JOIN product_entity_text pt_desc 
        ON pe.entity_id = pt_desc.entity_id 
        AND pt_desc.attribute_id = 4
        
      -- Join status (int)
      LEFT JOIN product_entity_int pi_status 
        ON pe.entity_id = pi_status.entity_id 
        AND pi_status.attribute_id = 5
        
      -- Join seller (int)
      LEFT JOIN product_entity_int pi_seller 
        ON pe.entity_id = pi_seller.entity_id 
        AND pi_seller.attribute_id = 6
        
      -- Join user table for seller name
      LEFT JOIN user u ON pi_seller.value = u.user_id

      -- Join categories
      LEFT JOIN category_product cp ON pe.entity_id = cp.product_id
      LEFT JOIN category c ON cp.category_id = c.category_id
      
      WHERE pi_status.value = 1
      GROUP BY pe.entity_id, pe.sku, u.name, u.user_id, pv_name.value, pd_price.value, 
               pv_image.value, pt_desc.value, pi_status.value
      ORDER BY pe.entity_id DESC
      LIMIT ${offset}, ${limit}
    `;
    
    try {
      const [rows] = await db.execute(query, [limit, offset]);
      const [countResult] = await db.execute(`
        SELECT COUNT(DISTINCT pe.entity_id) as total
        FROM product_entity pe
        LEFT JOIN product_entity_int pi_status 
        ON pe.entity_id = pi_status.entity_id AND pi_status.attribute_id = 5
        WHERE pi_status.value = 1
      `);

      const totalItems = countResult[0].total;
      const totalPages = Math.ceil(totalItems / limit)
      return {
        data: rows,
        pagination: {
          page, 
          limit,
          totalItems,
          totalPages
        }
      };
    } catch (error) {
      throw error;
    }
  }

  static async findById(entityId) {
    const query = `
      SELECT 
        pe.entity_id,
        pe.sku,
        u.name as seller_name,
        u.user_id as seller_id,
        pv_name.value as name,
        pd_price.value as price,
        pv_image.value as image_path,
        pt_desc.value as description,
        pi_status.value as status,
        -- Size (for clothes)
        pv_size.value as size,
        -- Color (for clothes)  
        pv_color.value as color,
        -- Categories
        GROUP_CONCAT(DISTINCT c.name SEPARATOR ', ') as categories
      FROM product_entity pe
      
      LEFT JOIN product_entity_varchar pv_name 
        ON pe.entity_id = pv_name.entity_id AND pv_name.attribute_id = 1
      LEFT JOIN product_entity_decimal pd_price 
        ON pe.entity_id = pd_price.entity_id AND pd_price.attribute_id = 2
      LEFT JOIN product_entity_varchar pv_image 
        ON pe.entity_id = pv_image.entity_id AND pv_image.attribute_id = 3
      LEFT JOIN product_entity_text pt_desc 
        ON pe.entity_id = pt_desc.entity_id AND pt_desc.attribute_id = 4
      LEFT JOIN product_entity_int pi_status 
        ON pe.entity_id = pi_status.entity_id AND pi_status.attribute_id = 5
      LEFT JOIN product_entity_int pi_seller 
        ON pe.entity_id = pi_seller.entity_id AND pi_seller.attribute_id = 6

      -- Join size (varchar) - for clothes
      LEFT JOIN product_entity_varchar pv_size 
        ON pe.entity_id = pv_size.entity_id 
        AND pv_size.attribute_id = (SELECT attribute_id FROM attribute WHERE code = 'size')

      -- Join color (varchar) - for clothes
      LEFT JOIN product_entity_varchar pv_color 
        ON pe.entity_id = pv_color.entity_id 
        AND pv_color.attribute_id = (SELECT attribute_id FROM attribute WHERE code = 'color')

      LEFT JOIN user u ON pi_seller.value = u.user_id

      -- Join categories
      LEFT JOIN category_product cp ON pe.entity_id = cp.product_id
      LEFT JOIN category c ON cp.category_id = c.category_id
      
      WHERE pe.entity_id = ? AND pi_status.value = 1
      GROUP BY pe.entity_id, pe.sku, u.name, u.user_id, pv_name.value, pd_price.value, 
               pv_image.value, pt_desc.value, pi_status.value, pv_size.value, pv_color.value
    `;
    
    try {
      const [rows] = await db.execute(query, [entityId]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Updated findBySellerId method with size and color
  static async findBySellerId(sellerId) {
    const query = `
      SELECT 
        pe.entity_id,
        pe.sku,
        u.name as seller_name,
        u.user_id as seller_id,
        -- Name
        pv_name.value as name,
        -- Price  
        pd_price.value as price,
        -- Image
        pv_image.value as image_path,
        -- Description
        pt_desc.value as description,
        -- Status
        pi_status.value as status,
        -- Size (for clothes)
        pv_size.value as size,
        -- Color (for clothes)
        pv_color.value as color,
        -- Categories
        GROUP_CONCAT(DISTINCT c.name SEPARATOR ', ') as categories
      FROM product_entity pe
      
      -- Join name (varchar)
      LEFT JOIN product_entity_varchar pv_name 
        ON pe.entity_id = pv_name.entity_id 
        AND pv_name.attribute_id = 1
      
      -- Join price (decimal)
      LEFT JOIN product_entity_decimal pd_price 
        ON pe.entity_id = pd_price.entity_id 
        AND pd_price.attribute_id = 2
        
      -- Join image (varchar)
      LEFT JOIN product_entity_varchar pv_image 
        ON pe.entity_id = pv_image.entity_id 
        AND pv_image.attribute_id = 3
        
      -- Join description (text)
      LEFT JOIN product_entity_text pt_desc 
        ON pe.entity_id = pt_desc.entity_id 
        AND pt_desc.attribute_id = 4
        
      -- Join status (int)
      LEFT JOIN product_entity_int pi_status 
        ON pe.entity_id = pi_status.entity_id 
        AND pi_status.attribute_id = 5
        
      -- Join seller (int)
      LEFT JOIN product_entity_int pi_seller 
        ON pe.entity_id = pi_seller.entity_id 
        AND pi_seller.attribute_id = 6

      -- Join size (varchar) - for clothes
      LEFT JOIN product_entity_varchar pv_size 
        ON pe.entity_id = pv_size.entity_id 
        AND pv_size.attribute_id = (SELECT attribute_id FROM attribute WHERE code = 'size')

      -- Join color (varchar) - for clothes
      LEFT JOIN product_entity_varchar pv_color 
        ON pe.entity_id = pv_color.entity_id 
        AND pv_color.attribute_id = (SELECT attribute_id FROM attribute WHERE code = 'color')
        
      -- Join user table for seller info
      LEFT JOIN user u ON pi_seller.value = u.user_id

      -- Join categories
      LEFT JOIN category_product cp ON pe.entity_id = cp.product_id
      LEFT JOIN category c ON cp.category_id = c.category_id
      
      WHERE pi_seller.value = ? AND pi_status.value = 1
      GROUP BY pe.entity_id, pe.sku, u.name, u.user_id, pv_name.value, pd_price.value, 
               pv_image.value, pt_desc.value, pi_status.value, pv_size.value, pv_color.value
      ORDER BY pe.entity_id DESC
    `;
    
    try {
      const [rows] = await db.execute(query, [sellerId]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async create(productData) {
    const { sku, name, price, image_path, description, seller_id, status = 1, category, size, color } = productData;
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const [entityResult] = await connection.execute(
        'INSERT INTO product_entity (entity_type_id, attribute_set_id, sku) VALUES (1, 1, ?)',
        [sku]
      );
      
      const entityId = entityResult.insertId;
      
      const insertPromises = [];
      
      if (name) {
        insertPromises.push(
          connection.execute(
            'INSERT INTO product_entity_varchar (entity_id, attribute_id, value) VALUES (?, ?, ?)',
            [entityId, 1, name]
          )
        );
      }
      
      if (price !== undefined && price !== null) {
        insertPromises.push(
          connection.execute(
            'INSERT INTO product_entity_decimal (entity_id, attribute_id, value) VALUES (?, ?, ?)',
            [entityId, 2, parseFloat(price)]
          )
        );
      }
      
      if (image_path) {
        insertPromises.push(
          connection.execute(
            'INSERT INTO product_entity_varchar (entity_id, attribute_id, value) VALUES (?, ?, ?)',
            [entityId, 3, image_path]
          )
        );
      }
      
      if (description && description !== '') {
        insertPromises.push(
          connection.execute(
            'INSERT INTO product_entity_text (entity_id, attribute_id, value) VALUES (?, ?, ?)',
            [entityId, 4, description]
          )
        );
      }
      
      insertPromises.push(
        connection.execute(
          'INSERT INTO product_entity_int (entity_id, attribute_id, value) VALUES (?, ?, ?)',
          [entityId, 5, parseInt(status)]
        )
      );
      
      if (seller_id) {
        insertPromises.push(
          connection.execute(
            'INSERT INTO product_entity_int (entity_id, attribute_id, value) VALUES (?, ?, ?)',
            [entityId, 6, parseInt(seller_id)]
          )
        );
      }

      const isClothes = category && (
        category.toLowerCase().includes('clothes') || 
        category.toLowerCase().includes('dress') || 
        category.toLowerCase().includes('shirt') || 
        category.toLowerCase().includes('jeans')
      );

      if (isClothes) {
        const sizeAttrId = await this.getAttributeId('size');
        const colorAttrId = await this.getAttributeId('color');

        if (size && sizeAttrId) {
          insertPromises.push(
            connection.execute(
              'INSERT INTO product_entity_varchar (entity_id, attribute_id, value) VALUES (?, ?, ?)',
              [entityId, sizeAttrId, size]
            )
          );
        }

        if (color && colorAttrId) {
          insertPromises.push(
            connection.execute(
              'INSERT INTO product_entity_varchar (entity_id, attribute_id, value) VALUES (?, ?, ?)',
              [entityId, colorAttrId, color]
            )
          );
        }
      }
      
      await Promise.all(insertPromises);
      
      if (category && category !== '') {
        const [categoryRows] = await connection.execute(
          'SELECT category_id FROM category WHERE name = ? AND is_active = ?',
          [category, 1]
        );
        
        if (categoryRows.length > 0) {
          await connection.execute(
            'INSERT INTO category_product (category_id, product_id, position) VALUES (?, ?, ?)',
            [categoryRows[0].category_id, entityId, 0]
          );
        }
      }
      
      await connection.commit();
      console.log('Create in model: ', productData);
      
      return entityId;
      
    } catch (error) {
      await connection.rollback();
      console.log('Create failed:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  static async update(entityId, productData) {
    const { sku, name, price, image_path, description, seller_id, status, category, size, color } = productData;
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      if (sku) {
        await connection.execute(
          'UPDATE product_entity SET sku = ? WHERE entity_id = ?',
          [sku, entityId]
        );
      }
      
      const updatePromises = [];
      
      if (name !== undefined && name !== null) {
        updatePromises.push(
          connection.execute(
            `INSERT INTO product_entity_varchar (entity_id, attribute_id, value) 
            VALUES (?, 1, ?) 
            ON DUPLICATE KEY UPDATE value = VALUES(value)`,
            [entityId, name]
          )
        );
      }
      
      if (price !== undefined && price !== null) {
        updatePromises.push(
          connection.execute(
            `INSERT INTO product_entity_decimal (entity_id, attribute_id, value) 
            VALUES (?, 2, ?) 
            ON DUPLICATE KEY UPDATE value = VALUES(value)`,
            [entityId, parseFloat(price)]
          )
        );
      }
      
      if (image_path !== undefined && image_path !== null) {
        updatePromises.push(
          connection.execute(
            `INSERT INTO product_entity_varchar (entity_id, attribute_id, value) 
            VALUES (?, 3, ?) 
            ON DUPLICATE KEY UPDATE value = VALUES(value)`,
            [entityId, image_path]
          )
        );
      }
      
      if (description !== undefined && description !== null) {
        updatePromises.push(
          connection.execute(
            `INSERT INTO product_entity_text (entity_id, attribute_id, value) 
            VALUES (?, 4, ?) 
            ON DUPLICATE KEY UPDATE value = VALUES(value)`,
            [entityId, description]
          )
        );
      }
      
      if (status !== undefined && status !== null) {
        updatePromises.push(
          connection.execute(
            `INSERT INTO product_entity_int (entity_id, attribute_id, value) 
            VALUES (?, 5, ?) 
            ON DUPLICATE KEY UPDATE value = VALUES(value)`,
            [entityId, parseInt(status)]
          )
        );
      }
      
      if (seller_id !== undefined && seller_id !== null) {
        updatePromises.push(
          connection.execute(
            `INSERT INTO product_entity_int (entity_id, attribute_id, value) 
            VALUES (?, 6, ?) 
            ON DUPLICATE KEY UPDATE value = VALUES(value)`,
            [entityId, parseInt(seller_id)]
          )
        );
      }

      const isClothes = await this.isClothesProduct(entityId) || (category && (
        category.toLowerCase().includes('clothes') || 
        category.toLowerCase().includes('dress') || 
        category.toLowerCase().includes('shirt') || 
        category.toLowerCase().includes('jeans')
      ));

      if (isClothes) {
        const sizeAttrId = await this.getAttributeId('size');
        const colorAttrId = await this.getAttributeId('color');

        if (size !== undefined && size !== null && sizeAttrId) {
          updatePromises.push(
            connection.execute(
              `INSERT INTO product_entity_varchar (entity_id, attribute_id, value) 
              VALUES (?, ?, ?) 
              ON DUPLICATE KEY UPDATE value = VALUES(value)`,
              [entityId, sizeAttrId, size]
            )
          );
        }

        if (color !== undefined && color !== null && colorAttrId) {
          updatePromises.push(
            connection.execute(
              `INSERT INTO product_entity_varchar (entity_id, attribute_id, value) 
              VALUES (?, ?, ?) 
              ON DUPLICATE KEY UPDATE value = VALUES(value)`,
              [entityId, colorAttrId, color]
            )
          );
        }
      }
      
      await Promise.allSettled(updatePromises);
      
      if (category !== undefined) {
        await connection.execute(
          'DELETE FROM category_product WHERE product_id = ?',
          [entityId]
        );
        
        if (category && category !== '') {
          const [categoryRows] = await connection.execute(
            'SELECT category_id FROM category WHERE name = ? AND is_active = ?',
            [category, 1]
          );
          
          if (categoryRows.length > 0) {
            await connection.execute(
              'INSERT INTO category_product (category_id, product_id, position) VALUES (?, ?, ?)',
              [categoryRows[0].category_id, entityId, 0]
            );
          }
        }
      }
      
      await connection.commit();
      console.log('UPDATE COMPLETED SUCCESSFULLY');
      return true;
      
    } catch (error) {
      console.error('UPDATE ERROR', error);
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async softDelete(entityId) {
    try {
      await db.execute(
        `INSERT INTO product_entity_int (entity_id, attribute_id, value) 
         VALUES (?, 5, 0) 
         ON DUPLICATE KEY UPDATE value = 0`,
        [entityId]
      );
      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ProductEAV;