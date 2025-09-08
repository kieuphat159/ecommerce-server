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

  static async create(productData) {
    const { sku, name, price, image_path, description, seller_id } = productData;
    
    try {
      await db.execute('START TRANSACTION');
      
      // Insert product entity
      const [entityResult] = await db.execute(
        'INSERT INTO product_entity (entity_type_id, attribute_set_id, sku) VALUES (1, 1, ?)',
        [sku]
      );
      
      const entityId = entityResult.insertId;
      
      // Insert attributes
      const insertPromises = [];
      
      // Name (varchar)
      if (name) {
        insertPromises.push(
          db.execute(
            'INSERT INTO product_entity_varchar (entity_id, attribute_id, value) VALUES (?, 1, ?)',
            [entityId, name]
          )
        );
      }
      
      // Price (decimal)
      if (price) {
        insertPromises.push(
          db.execute(
            'INSERT INTO product_entity_decimal (entity_id, attribute_id, value) VALUES (?, 2, ?)',
            [entityId, price]
          )
        );
      }
      
      // Image (varchar)
      if (image_path) {
        insertPromises.push(
          db.execute(
            'INSERT INTO product_entity_varchar (entity_id, attribute_id, value) VALUES (?, 3, ?)',
            [entityId, image_path]
          )
        );
      }
      
      // Description (text)
      if (description) {
        insertPromises.push(
          db.execute(
            'INSERT INTO product_entity_text (entity_id, attribute_id, value) VALUES (?, 4, ?)',
            [entityId, description]
          )
        );
      }
      
      // Status (int) - default active = 1
      insertPromises.push(
        db.execute(
          'INSERT INTO product_entity_int (entity_id, attribute_id, value) VALUES (?, 5, 1)',
          [entityId]
        )
      );
      
      // Seller ID (int)
      if (seller_id) {
        insertPromises.push(
          db.execute(
            'INSERT INTO product_entity_int (entity_id, attribute_id, value) VALUES (?, 6, ?)',
            [entityId, seller_id]
          )
        );
      }
      
      // Execute all inserts
      await Promise.all(insertPromises);
      
      // Commit transaction
      await db.execute('COMMIT');
      
      return entityId;
      
    } catch (error) {
      // Rollback on error
      await db.execute('ROLLBACK');
      throw error;
    }
  }
}

module.exports = ProductEAV;