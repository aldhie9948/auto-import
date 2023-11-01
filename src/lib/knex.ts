import knex from "knex";

const host = ["development", "test"].includes(<string>process.env.NODE_ENV)
  ? "localhost"
  : "127.0.0.1";

const initKnex = (database: string) =>
  knex({
    client: "mysql",
    connection: {
      host,
      port: 3306,
      user: "root",
      password: "nkp123",
      database,
    },
  });

export default initKnex;
