const db = require('../config/database');

class ProductEAV {
  // attr_id = 5: status

  // Lay tat ca voi attr
  static async findAll() {
    const query = `
      SELECT DISTINCT
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
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      const [entityResult] = await db.execute(
        'INSERT INTO product_entity (entity_type_id, attribute_set_id, sku) VALUES (1, 1, ?)',
        [sku]
      );
      
      const entityId = entityResult.insertId;
      
      const insertPromises = [];
      
      if (name) {
        insertPromises.push(
          db.execute(
            'INSERT INTO product_entity_varchar (entity_id, attribute_id, value) VALUES (?, ?, ?)',
            [entityId, 1, name]
          )
        );
      }
      
      if (price !== undefined && price !== null) {
        insertPromises.push(
          db.execute(
            'INSERT INTO product_entity_decimal (entity_id, attribute_id, value) VALUES (?, ?, ?)',
            [entityId, 2, parseFloat(price)]
          )
        );
      }
      
      if (image_path) {
        insertPromises.push(
          db.execute(
            'INSERT INTO product_entity_varchar (entity_id, attribute_id, value) VALUES (?, ?, ?)',
            [entityId, 3, image_path]
          )
        );
      }
      
      if (description && description !== '') {
        insertPromises.push(
          db.execute(
            'INSERT INTO product_entity_text (entity_id, attribute_id, value) VALUES (?, ?, ?)',
            [entityId, 4, description]
          )
        );
      }
      
      insertPromises.push(
        db.execute(
          'INSERT INTO product_entity_int (entity_id, attribute_id, value) VALUES (?, ?, ?)',
          [entityId, 5, parseInt(status)]
        )
      );
      
      if (seller_id) {
        insertPromises.push(
          db.execute(
            'INSERT INTO product_entity_int (entity_id, attribute_id, value) VALUES (?, ?, ?)',
            [entityId, 6, parseInt(seller_id)]
          )
        );
      }
      
      await Promise.all(insertPromises);
      
      if (category && category !== '') {
        const [categoryRows] = await db.execute(
          'SELECT category_id FROM category WHERE name = ? AND is_active = ?',
          [category, 1]
        );
        
        if (categoryRows.length > 0) {
          await db.execute(
            'INSERT INTO category_product (category_id, product_id, position) VALUES (?, ?, ?)',
            [categoryRows[0].category_id, entityId, 0]
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

 static async update(entityId, productData) {
  
  const { sku, name, price, image_path, description, seller_id, status, category } = productData;
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
    
    // Update name (attribute_id = 1)
    if (name !== undefined && name !== null) {
      updatePromises.push(
        connection.execute(
          `INSERT INTO product_entity_varchar (entity_id, attribute_id, value) 
          VALUES (?, 1, ?) 
          ON DUPLICATE KEY UPDATE value = VALUES(value)`,
          [entityId, name]
        ).then(() => console.log('Name updated successfully'))
        .catch(err => console.error('Name update failed:', err))
      );
    }
    
    if (price !== undefined && price !== null) {
      console.log('Preparing price update:', price, 'Type:', typeof price);
      updatePromises.push(
        connection.execute(
          `INSERT INTO product_entity_decimal (entity_id, attribute_id, value) 
          VALUES (?, 2, ?) 
          ON DUPLICATE KEY UPDATE value = VALUES(value)`,
          [entityId, parseFloat(price)]
        ).then(() => console.log('Price updated successfully'))
        .catch(err => console.error('Price update failed:', err))
      );
    }
    
    if (image_path !== undefined && image_path !== null) {
      console.log('Preparing image update:', image_path);
      updatePromises.push(
        connection.execute(
          `INSERT INTO product_entity_varchar (entity_id, attribute_id, value) 
          VALUES (?, 3, ?) 
          ON DUPLICATE KEY UPDATE value = VALUES(value)`,
          [entityId, image_path]
        ).then(() => console.log('Image updated successfully'))
        .catch(err => console.error('Image update failed:', err))
      );
    }
    
    if (description !== undefined && description !== null) {
      console.log('Preparing description update:', description);
      updatePromises.push(
        connection.execute(
          `INSERT INTO product_entity_text (entity_id, attribute_id, value) 
          VALUES (?, 4, ?) 
          ON DUPLICATE KEY UPDATE value = VALUES(value)`,
          [entityId, description]
        ).then(() => console.log('Description updated successfully'))
        .catch(err => console.error('Description update failed:', err))
      );
    }
    
    if (status !== undefined && status !== null) {
      updatePromises.push(
        connection.execute(
          `INSERT INTO product_entity_int (entity_id, attribute_id, value) 
          VALUES (?, 5, ?) 
          ON DUPLICATE KEY UPDATE value = VALUES(value)`,
          [entityId, parseInt(status)]
        ).then(() => console.log('Status updated successfully'))
        .catch(err => console.error('Status update failed:', err))
      );
    }
    
    if (seller_id !== undefined && seller_id !== null) {
      updatePromises.push(
        connection.execute(
          `INSERT INTO product_entity_int (entity_id, attribute_id, value) 
          VALUES (?, 6, ?) 
          ON DUPLICATE KEY UPDATE value = VALUES(value)`,
          [entityId, parseInt(seller_id)]
        ).then(() => console.log('Seller ID updated successfully'))
        .catch(err => console.error('Seller ID update failed:', err))
      );
    }
    
    const results = await Promise.allSettled(updatePromises);
    
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Update operation ${index} failed:`, result.reason);
      }
    });
    
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
    console.log('Connection released');
  }
}
  // Xoa product (soft delete)
  static async softDelete(entityId) {
    try {
      // attr id = 5: status
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