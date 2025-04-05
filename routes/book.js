const express = require('express');

module.exports = function(dalBook) {
    const route = express.Router();

    if (!dalBook) throw Error('Book is required!');

    route.get('/books', async function (req, res) {
        try {
            const books = await dalBook.getBooks(req.query);
            return res.json(books);
        } catch (error) {
            console.error("Error fetching books:", error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    });

    route.post('/books', async function (req, res) {
        try {
            const addedBook = await dalBook.postBook(req.body);
            return res.json(addedBook);
        } catch (error) {
            return res.status(500).json({error: error});
        }
    })

    route.get('/books/:bookID', async function (req, res) {
        let bookID = req.params.bookID;
        try {
            const book = await dalBook.getBook_byID(bookID);  

            if (!book) {
                return res.status(404).json({ error: "Book not found" });  
            }

            return res.status(200).json(book);  
        } catch (error) {
            return res.status(500).json({error: error});
        }
    })

    route.get('/analytics/books/most-borrowed/:distance', async function (req, res) {
        let distance = req.params.distance; // Số tháng cần thống kê

        if (!distance || !isNaN(distance)) {
            distance = 6;
        }

        try {
            const books = await dalBook.get_most_borrow({ distance });

            return res.status(200).json(books);
        } catch (error) {
            return res.status(500).json({error: error});
        }
    })

    return route;
};
