process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');
const Book = require('../models/book');

// Before Each Test
let book_isbn;
beforeEach(async () => {
    let result = await db.query(
        `INSERT INTO books
		(isbn, amazon_url, author, language, pages, publisher, title, year)
		VALUES (
			'0691161518',
			'http://a.co/eobPtX2',
			'Matthew Lane',
			'english',	
			264,
			'Princeton University Press',
			'Power-Up: Unlocking the Hidden Mathematics in Video Games',
			2017) 
			RETURNING isbn`
    );
    book_isbn = result.rows[0].isbn;
});

// Tests

describe('GET /books', () => {
    test('Gets list of all books', async () => {
        const response = await request(app).get('/books');
        const books = response.body.books;
        expect(books).toHaveLength(1);
        expect(books[0]).toHaveProperty('isbn');
        expect(books[0]).toHaveProperty('amazon_url');
    });
});

describe('GET /books/:isbn', () => {
    test('Gets a single book from isbn', async () => {
        const response = await request(app).get(`/books/${book_isbn}`);
        const book = response.body.book;
        expect(response.statusCode).toEqual(200);
        expect(book).toHaveProperty('isbn');
        expect(book.isbn).toBe(book_isbn);
    });
});

describe('POST /books', () => {
    test('Posts a new book.', async () => {
        const response = await request(app).post('/books').send({
            isbn: '0691161519',
            amazon_url:
                'https://www.amazon.com/Cracking-Coding-Interview-Programming-Questions/dp/0984782850',
            author: 'Gayle Laakmann McDowell',
            language: 'english',
            pages: 687,
            publisher: 'CareerCup',
            title: 'Cracking the Coding Interview',
            year: 2015,
        });
        const book = response.body.book;
        expect(response.statusCode).toEqual(201);
        expect(book).toHaveProperty('isbn');
        expect(book.isbn).toBe('0691161519');
    });
    test('Shows error stack for missing items.', async () => {
        const response = await request(app).post('/books').send({});
        const book = response.body;
        // expect(book).toHaveLength(0);
        expect(response.statusCode).toEqual(400);
        expect(book).toEqual({
            error: {
                message: [
                    'instance requires property "isbn"',
                    'instance requires property "amazon_url"',
                    'instance requires property "author"',
                    'instance requires property "language"',
                    'instance requires property "pages"',
                    'instance requires property "publisher"',
                    'instance requires property "title"',
                    'instance requires property "year"',
                ],
                status: 400,
            },
            message: [
                'instance requires property "isbn"',
                'instance requires property "amazon_url"',
                'instance requires property "author"',
                'instance requires property "language"',
                'instance requires property "pages"',
                'instance requires property "publisher"',
                'instance requires property "title"',
                'instance requires property "year"',
            ],
        });
    });
});

describe('PUT /books/:isbn', () => {
    test('Updates a single book.', async () => {
        const response = await request(app).put(`/books/${book_isbn}`).send({
            amazon_url:
                'https://www.amazon.com/Cracking-Coding-Interview-Programming-Questions/dp/0984782850',
            author: 'Gayle Laakmann McDowell',
            language: 'english',
            pages: 687,
            publisher: 'CareerCup',
            title: 'Cracking the Coding Interview',
            year: 2015,
        });
        const book = response.body.book;
        expect(response.statusCode).toEqual(200);
        expect(book.isbn).toBe(book_isbn);
    });
    test('Shows error for non existent book.', async () => {
        const response = await request(app).put('/books/0').send({
            amazon_url:
                'https://www.amazon.com/Cracking-Coding-Interview-Programming-Questions/dp/0984782850',
            author: 'Gayle Laakmann McDowell',
            language: 'english',
            pages: 687,
            publisher: 'CareerCup',
            title: 'Cracking the Coding Interview',
            year: 2015,
        });
        expect(response.statusCode).toEqual(404);
        expect(response.body).toEqual({
            error: {
                message: "There is no book with an isbn '0",
                status: 404,
            },
            message: "There is no book with an isbn '0",
        });
    });
});

describe('DELETE /books/:isbn', () => {
    test('Deletes a book', async () => {
        const response = await request(app).delete(`/books/${book_isbn}`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            message: 'Book deleted',
        });
    });
    test('Deletes book that does not exist', async () => {
        const response = await request(app).delete('/books/0');
        expect(response.statusCode).toEqual(404);
        expect(response.body).toEqual({
            error: {
                message: "There is no book with an isbn '0",
                status: 404,
            },
            message: "There is no book with an isbn '0",
        });
    });
});

// After Every Test
afterEach(async function () {
    await db.query('DELETE FROM BOOKS');
});

afterAll(async function () {
    await db.end();
});
