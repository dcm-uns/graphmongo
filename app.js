const Express = require("express");
const ExpressGraphQL = require("express-graphql");

// MonGoose es un ORM que nos permite abstraernos de algunos detalles de la base de datos,
// de forma tal de trabajar con el modelo de los datos, que definiremos luego.
const mongoose = require("mongoose");

// Como ofreceremos un endpoint GraphQL, es necesario especificar los esquemas (schemas)
// de nuestros datos. Por esa razón es necesario importar los tipos de datos GraphQL:
const {
	GraphQLID,
	GraphQLString,
	GraphQLList,
	GraphQLType,
	GraphQLSchema,
	GraphQLNonNull,
	GraphQLObjectType
} = require("graphql");

// Creamos la aplicación Express
var app = Express();
var cors = require("cors");
app.use(cors());

// Usamos mongoose como conector a la Base de Datos "amigos"
mongoose
	.connect("mongodb://127.0.0.1:27017/amigos")
	.then(() => console.log("Connected to database..."))
	.catch(err => console.error(err));

// Definimos el modelo de la base de datos, en este caso "Person", 
// formada solo por dos strings: firstName y lastName.
const PersonModel = mongoose.model("person", {
	firstName: String,
	lastName: String
});

// El anterior es para interactuar con mongoDB de manera simple
// Lo siguiente es para ofrecer al mundo el tipo Person como dato GrahQL
// Describe el mismo tipo de dato, pero con los tipos GraphQL
const PersonType = new GraphQLObjectType({
	name: "Person",
	fields: {
		id: { type: GraphQLID },
		firstName: { type: GraphQLString },
		lastName: { type: GraphQLString }
	}
});

// Aqui la definición completa del esquema de nuestro endpoint.
// Tenemos consultas y mutaciones.
const schema = new GraphQLSchema({
	query: new GraphQLObjectType({
		name: "Query",
		fields: {
			// Consulta "people"
			people: {
				type: GraphQLList(PersonType),
				// Lo siguiente es la implementacion de esta consulta
				// que usa el modelo para pedirle datos a Mongo.
				resolve: (root, args, context, info) => {
					return PersonModel.find().exec();
				}
			},
			// consulta peopleByID
			peopleByID: {
				type: PersonType,
				// requiere un argumenti ID, que no podrá ser nulo.
				args: {
					id: { type: GraphQLNonNull(GraphQLID) }
				},
				// Lo siguiente es la implementación de la consulta
				// que al igual que la anterior, usa PersonModel para comunicarnos con Mongo
				resolve: (root, args, context, info) => {
					return PersonModel.findById(args.id).exec();
				}
			},
			// Otra consulta similar a las anteriores.
			peopleByName: {
				type: GraphQLList(PersonType),
				args: { 
					firstName: { type: GraphQLString } 
				},
				resolve: (root, args, context, info) => {
					return PersonModel.find({'firstName':args.firstName}).exec();
				}
			}
		}
	}),

	// Las mutacipones son las acciones de modificación de datos en nuestro endpoint.
	mutation: new GraphQLObjectType({
		// Nombre de la mutación y los datos que recibe.
		name: "Create",
		fields: {
			people: {
				type: PersonType,
				args: {
					firstName: { type: GraphQLString },
					lastName: { type: GraphQLString }
				},
				// La implementación de la mutación nuevamente usa mongoose.
				// Simplemente guarda el dato que nos pasan.
				resolve: (root, args, context, info) => {
					var people = new PersonModel(args);
					return people.save();
				}
			}
		}
	})
});

// Cuando en nuestra applicacion la URL tiene "/amigos", quien procesa esto es ExpressGraphQL.
// Este es el motor de ejecución que hará lo que dijimos en las líneas anteriores.
// Además deseamos que GraphiQL esté disponible.
app.use("/amigos", ExpressGraphQL({schema, graphiql: true}));

app.listen(3001, () => {
	console.log("server running at 3001");
});
