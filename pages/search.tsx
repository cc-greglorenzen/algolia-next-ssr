import algoliasearch from 'algoliasearch/lite';
import { Hit as AlgoliaHit } from 'instantsearch.js';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import singletonRouter from 'next/router';
import { renderToString } from 'react-dom/server';
import {
	DynamicWidgets,
	Highlight,
	Hits,
	InstantSearch,
	InstantSearchSSRProvider,
	InstantSearchServerState,
	RefinementList,
	SearchBox,
	getServerState,
} from 'react-instantsearch';
import { createInstantSearchRouterNext } from 'react-instantsearch-router-nextjs';
import type { UiState } from "instantsearch.js";

import { Panel } from '../components/Panel';

const client = algoliasearch(
	"146SHEU3H5",
	"a89532a4840b399a678ecda2e2033f14"
);

type HitProps = {
	hit: AlgoliaHit<{
		name: string;
		price: number;
	}>;
};

function Hit({ hit }: HitProps) {
	return (
		<>
			<Highlight hit={hit} attribute="name" className="Hit-label" />
			<span className="Hit-price">${hit.price}</span>
		</>
	);
}

type HomePageProps = {
	serverState?: InstantSearchServerState;
	url?: string;
};

// Returns a slug from the category name.
// Spaces are replaced by "+" to make
// the URL easier to read and other
// characters are encoded.
function getCategorySlug(name: any) {
	return name.split(" ").map(encodeURIComponent).join("+");
}

// Returns a name from the category slug.
// The "+" are replaced by spaces and other
// characters are decoded.
function getCategoryName(slug: any) {
	return slug.split("+").map(decodeURIComponent).join(" ");
}

export default function SearchPage({ serverState, url }: HomePageProps) {
	return (
		<InstantSearchSSRProvider {...serverState}>
			<Head>
				<title>React InstantSearch - Next.js</title>
			</Head>

			<InstantSearch
				searchClient={client}
				indexName="dev_anawaltlumber"
				routing={{
					router: createInstantSearchRouterNext({
						singletonRouter,
						serverUrl: url,
						routerOptions: {
							createURL({ qsModule, routeState, location }) {
								const urlParts: string | null | RegExpMatchArray =
									location.href.match(/^(.*?)\/search/);
								const baseUrl = `${urlParts ? urlParts[1] : ""}/`;

								const categoryPath = routeState.category
									? `${getCategorySlug(routeState.category)}/`
									: "";
								const queryParameters: {
									query?: UiState["indexId"]["query"];
									page?: UiState["indexId"]["page"];
									location?: Location;
								} = {};

								if (
									routeState["dev_anawaltlumber"].query
								) {
									queryParameters.query = encodeURIComponent(
										routeState["dev_anawaltlumber"]
											.query ?? ""
									);
								}
								if (
									routeState["dev_anawaltlumber"]
										.page !== 1
								) {
									queryParameters.page =
										routeState[
											"dev_anawaltlumber"
										].page;
								}

								const queryString = qsModule.stringify(queryParameters, {
									addQueryPrefix: true,
									arrayFormat: "repeat",
								});

								return `${baseUrl}search/${categoryPath}${queryString}`;
							},
							parseURL({ qsModule, location }) {
								const pathnameMatches =
									location.pathname.match(/search\/(.*?)\/?$/);
								const category = getCategoryName(pathnameMatches?.[1] || "");
								const { query = "", page } = qsModule.parse(
									location.search.slice(1)
								);

								return {
									["dev_anawaltlumber"]: {
										query: decodeURIComponent(query as string) ?? "",
										category,
										page: parseInt((page as string) ?? "1"),
									},
								};
							},
						},
					}),
					stateMapping: {
						stateToRoute(uiState: UiState) {
							const indexUiState =
								uiState["dev_anawaltlumber"] || {};

							return {
								["dev_anawaltlumber"]: {
									query: indexUiState.query,
									page: indexUiState.page,
									brands: indexUiState.refinementList?.brand,
									category: indexUiState.menu?.categories,
								},
							};
						},

						routeToState(routeState: UiState) {
							return {
								["dev_anawaltlumber"]: {
									query: routeState[
										"dev_anawaltlumber"
									].query,
									page: routeState["dev_anawaltlumber"]
										.page,
									// menu: {
									// 	categories: routeState["dev_anawaltlumber"].category,
									// },
								},
							};
						},
					},
				}}
				insights={true}
			>
				<div className="Container">
					<div>
						<DynamicWidgets fallbackComponent={FallbackComponent} />
					</div>
					<div>
						<SearchBox />
						<Hits />
					</div>
				</div>
			</InstantSearch>
		</InstantSearchSSRProvider>
	);
}

function FallbackComponent({ attribute }: { attribute: string }) {
	return (
		<Panel header={attribute}>
			<RefinementList attribute={attribute} />
		</Panel>
	);
}

export const getServerSideProps: GetServerSideProps<HomePageProps> =
	async function getServerSideProps({ req }) {
		const protocol = req.headers.referer?.split('://')[0] || 'https';
		const url = `${protocol}://${req.headers.host}${req.url}`;
		const serverState = await getServerState(<SearchPage url={url} />, {
			renderToString,
		});

		return {
			props: {
				serverState,
				url,
			},
		};
	};
