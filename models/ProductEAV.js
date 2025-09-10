const db = require('../config/database');

class ProductEAV {
  
  // Lay tat ca voi attr
  static async findAll() {
    const query = `
      SELECT 
        pe.entity_id,
        pe.sku,
        u.name as seller_name,
        -- Name
        pv_name.value as name,
        -- Price  
        pd_price.value as price,
        -- Image
        pv_image.value as image_path,
        -- Description
        pt_desc.value as description,
        -- Status
        pi_status.value as status
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
      
      WHERE pi_status.value = 1
      ORDER BY pe.entity_id DESC
    `;
    
    try {
      const [rows] = await db.execute(query);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Lay product theo Id
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
        pi_status.value as status
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
      LEFT JOIN user u ON pi_seller.value = u.user_id
      
      WHERE pe.entity_id = ? AND pi_status.value = 1
    `;
    
    try {
      const [rows] = await db.execute(query, [entityId]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

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
      pi_status.value as status
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
      
    -- Join user table for seller info
    LEFT JOIN user u ON pi_seller.value = u.user_id
    
    WHERE pi_seller.value = ? AND pi_status.value = 1
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
    const { sku, name, price, image_path, description, seller_id, status = 1, category } = productData;
    
    try {
      await db.execute('START TRANSACTION');
      
      const [entityResult] = await db.execute(
        'INSERT INTO product_entity (entity_type_id, attribute_set_id, sku) VALUES (1, 1, ?)',
        [sku]
      );
      
      const entityId = entityResult.insertId;
      
      const insertPromises = [];
      
      if (name) {
        insertPromises.push(
          db.execute(
            'INSERT INTO product_entity_varchar (entity_id, attribute_id, value) VALUES (?, 1, ?)',
            [entityId, name]
          )
        );
      }
      
      if (price !== undefined && price !== null) {
        insertPromises.push(
          db.execute(
            'INSERT INTO product_entity_decimal (entity_id, attribute_id, value) VALUES (?, 2, ?)',
            [entityId, parseFloat(price)]
          )
        );
      }
      
      if (image_path) {
        insertPromises.push(
          db.execute(
            'INSERT INTO product_entity_varchar (entity_id, attribute_id, value) VALUES (?, 3, ?)',
            [entityId, image_path]
          )
        );
      }
      
      if (description) {
        insertPromises.push(
          db.execute(
            'INSERT INTO product_entity_text (entity_id, attribute_id, value) VALUES (?, 4, ?)',
            [entityId, description]
          )
        );
      }
      
      insertPromises.push(
        db.execute(
          'INSERT INTO product_entity_int (entity_id, attribute_id, value) VALUES (?, 5, ?)',
          [entityId, parseInt(status)]
        )
      );
      
      if (seller_id) {
        insertPromises.push(
          db.execute(
            'INSERT INTO product_entity_int (entity_id, attribute_id, value) VALUES (?, 6, ?)',
            [entityId, parseInt(seller_id)]
          )
        );
      }
      
      await Promise.all(insertPromises);
      
      if (category) {
        const [categoryRows] = await db.execute(
          'SELECT category_id FROM category WHERE name = ? AND is_active = 1',
          [category]
        );
        
        if (categoryRows.length > 0) {
          await db.execute(
            'INSERT INTO category_product (category_id, product_id, position) VALUES (?, ?, 0)',
            [categoryRows[0].category_id, entityId]
          );
        }
      }
      
      await db.execute('COMMIT');
      
      return entityId;
      
    } catch (error) {
      await db.execute('ROLLBACK');
      throw error;
    }
  }

  // Xoa product (soft delete)
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