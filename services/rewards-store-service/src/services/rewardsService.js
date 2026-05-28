class ClaimError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function processClaim(pool, user_id, merchandise_id, quantity) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock merchandise row to prevent race conditions
    const merchResult = await client.query(
      `SELECT * FROM merchandise WHERE id = $1 AND is_available = true FOR UPDATE`,
      [merchandise_id]
    );

    if (merchResult.rows.length === 0) {
      throw new ClaimError('Merchandise not found or unavailable', 404);
    }

    const item = merchResult.rows[0];
    const totalCost = item.cost_in_points * quantity;

    // Check stock
    if (item.stock_quantity < quantity) {
      throw new ClaimError('Insufficient stock', 400, {
        available: item.stock_quantity,
        requested: quantity
      });
    }

    // Lock user row to prevent race conditions on points
    const userResult = await client.query(
      `SELECT id, username, quest_points FROM users WHERE id = $1 FOR UPDATE`,
      [user_id]
    );

    if (userResult.rows.length === 0) {
      throw new ClaimError('User not found', 404);
    }

    const user = userResult.rows[0];

    // Check user has enough points
    if (user.quest_points < totalCost) {
      throw new ClaimError('Insufficient quest points', 400, {
        required: totalCost,
        available: user.quest_points,
        shortfall: totalCost - user.quest_points
      });
    }

    // Deduct points from user
    const updatedUserResult = await client.query(
      `UPDATE users SET quest_points = quest_points - $1 WHERE id = $2 RETURNING id, username, quest_points`,
      [totalCost, user_id]
    );

    // Reduce merchandise stock
    await client.query(
      `UPDATE merchandise SET stock_quantity = stock_quantity - $1, updated_at = NOW() WHERE id = $2`,
      [quantity, merchandise_id]
    );

    // Record the transaction
    const transactionResult = await client.query(
      `INSERT INTO rewards_transactions (user_id, merchandise_id, quantity, points_spent, status)
       VALUES ($1, $2, $3, $4, 'completed') RETURNING *`,
      [user_id, merchandise_id, quantity, totalCost]
    );

    await client.query('COMMIT');

    return {
      message: `Successfully claimed ${quantity}x ${item.name}! 🎉`,
      transaction: transactionResult.rows[0],
      item_claimed: item,
      points_spent: totalCost,
      remaining_points: updatedUserResult.rows[0].quest_points
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { processClaim, ClaimError };
