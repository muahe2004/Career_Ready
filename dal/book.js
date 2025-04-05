module.exports = function (pool) {
    if (!pool) {
        throw Error('Pool is required!');
    }

    async function getBooks(options) {
        let sql = `
            SELECT b.bookID, b.title, b.author, b.genre, publishedYear
            FROM public.books b 
            WHERE 1 = 1
        `;

        const params = [];
        // let paramIndex = 1;

        // if (options.name) {
        //     sql += ` AND b."name" ILIKE $${paramIndex}`;
        //     params.push(`%${options.name}%`);
        //     paramIndex++;
        // }

        // if (options.genre) {
        //     sql += ` AND b.genre = $${paramIndex}`;
        //     params.push(options.genre);
        //     paramIndex++;
        // }

        // sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        // params.push(options.limit || 10, options.offset || 0);

        try {
            const { rows } = await pool.query(sql, params);
            return rows;
        } catch (error) {
            console.error("Database Error:", error);
            throw error;
        }
    }

    async function postBook(bookData) {
        const { title, author, genre, publishedYear } = bookData;
        
        const sql = `INSERT INTO books(title, author, genre, publishedYear) VALUES ($1, $2, $3, $4) RETURNING *`;

        try {
            const { rows } = await pool.query(sql, [title, author, genre, publishedYear]);
            return rows[0]; 
        } catch (error) {
            throw error;
        }
    }

    async function getBook_byID(bookID) {
        let sql = 
        `
            SELECT b.bookID, b.title, b.author, b.genre, publishedYear
            FROM public.books b 
            WHERE bookID = $1
        `;

        try {
            const { rows } = await pool.query(sql, [bookID]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    async function get_most_borrow(options) {
        let sql = 
            `
                SELECT 
                    b.bookID,
                    b.title,
                    b.author,
                    b.genre,
                    COUNT(bh.borrowID) as borrow_count
                FROM books b
                JOIN borrowinghistory bh ON b.bookID = bh.bookID
                WHERE 1 = 1
            `;
            // WHERE bh.borrowed_date >= CURRENT_DATE - INTERVAL '6 months'


        const params = [];

        let paramIndex = 1;

        if (options.distance) {
            sql += `bh.borrowed_date >= CURRENT_DATE - INTERVAL '$${paramIndex} months'`;
            params.push(options.distance);  
            paramIndex++;
        }

        sql += 
            `
                GROUP BY b.bookID, b.title, b.author, b.genre
                ORDER BY borrow_count DESC
                LIMIT 5
            `;
        // params.push(`%${options.distance}%`);
        // paramIndex++;

        try {
            const { rows } = await pool.query(sql);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    return { getBooks, postBook, getBook_byID, get_most_borrow};
};
