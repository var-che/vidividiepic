import {
	Data,
	ItemsResponse,
	fetchArticlesAndStores,
	fetchDemoArticles,
	fetchItems,
} from '#app/utils/api.server.ts'
import { queryAll } from '#app/utils/surrealdb.server.ts'
import { LoaderFunction, json } from '@remix-run/node'
import { useFetcher, useLoaderData, useSearchParams } from '@remix-run/react'
import { useEffect, useRef, useState } from 'react'

export const loader: LoaderFunction = async remixContext => {
	const url = new URL(remixContext.request.url)
	const page = url.searchParams.get('page') || 1
	const opis = url.searchParams.get('opis_stvari') || 'hleb'
	const mesto = url.searchParams.get('mesto') || 'Niš'

	let result = await fetchDemoArticles({page: 1})
	
	return json({ status: 'idle', items: result.data } as const)
	// const result = await fetchArticlesAndStores({
	// 	item_desc: opis,
	// 	page: Number(page),
	// 	place: mesto,
	// })

	// let f = await fetchItems({page: 1});
	// console.log({f})
	// if (!result.success) {
	// 	return json(
	// 		{
	// 			status: 'error',
	// 			error:
	// 				'Postoji neka greška. Ukoliko se problem nastavi, kontaktirajte podršku. Hvala',
	// 		} as const,
	// 		{
	// 			status: 400,
	// 		},
	// 	)
	// }

	// return json({ status: 'idle', items: result.response } as const)
}

export default function Index() {
	const initialItems = useLoaderData<any>()
	const [searchParams, setSearchParams] = useSearchParams();
	const fetcher = useFetcher<any>()

	const [items, setItems] = useState<any[]>(initialItems.items)

	// An effect for appending data to items state
	useEffect(() => {
		console.log()
		if (!fetcher.data || fetcher.state === 'loading') {
			return
		}
		
		if (fetcher.data) {
			const newItems = fetcher.data.items
			setItems(prevAssets => [...prevAssets, ...newItems])
		}
	}, [fetcher.state, fetcher.data])

	return (
		<InfiniteScroller
			loadNext={() => {
				if(Number(searchParams.get("page"))){
					let page = Number(searchParams.get("page")) + 1

					const query = `?opis_stvari=verske&mesto=Niš&page=${page}`

					fetcher.load(query)
					searchParams.set("page", (page).toString())
				} else {
					const query = `?opis_stvari=verske&mesto=Niš&page=1`

					fetcher.load(query)
				}

				
			}}
			loading={fetcher.state === 'loading'}
		>
			{initialItems.status === 'idle' ? (
				initialItems.items.length ? (
					<div>
						{/* Items Grid */}
						<div className="items-container">
							{items.map((item, i) => (
								<div style={{ padding: 5, marginTop: 200 }}>
									<p key={i}>{item.article_name}</p>
								</div>
							))}
						</div>

						{/* Loader */}
					</div>
				) : (
					<p>We dont have data</p>
				)
			) : (
				<p>Its not idle</p>
			)}
		</InfiniteScroller>
	)
}

const InfiniteScroller = (props: {
	children: any
	loading: boolean
	loadNext: () => void
}) => {
	const { children, loading, loadNext } = props
	const scrollListener = useRef(loadNext)

	useEffect(() => {
		scrollListener.current = loadNext
	}, [loadNext])

	const onScroll = () => {
		const documentHeight = document.documentElement.scrollHeight
		const scrollDifference = Math.floor(window.innerHeight + window.scrollY)
		const scrollEnded = documentHeight == scrollDifference

		if (scrollEnded && !loading) {
			scrollListener.current()
		}
	}

	useEffect(() => {
		if (typeof window !== 'undefined') {
			window.addEventListener('scroll', onScroll)
		}

		return () => {
			window.removeEventListener('scroll', onScroll)
		}
	}, [])

	return <>{children}</>
}
